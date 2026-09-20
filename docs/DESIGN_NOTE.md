# Design Note: Scraping Reliability & Architectural Decisions

## Overview
INE's hosted mock store (`https://demo.inelabteamdev.com/`) is intentionally designed with subtle anti-scraping defenses to test scraper reliability under realistic, unattended conditions. This design note details how we analyzed the target site, engineered around its challenges, trade-offs made, and key corrections during development.

---

## 🔍 Technical Analysis of the Target Store

During empirical reverse-engineering of the mock store frontend bundle (`index-B9UiQq4X.js`), we uncovered four distinct anti-scraping mechanisms:

1. **Humanness & Mouse Dwell Check**:
   - The `.price-block` component tracks `onMouseMove` and `onMouseEnter` events.
   - It maintains a counter `minMoves` and dwell time `minDwellMs`. Until the mouse moves continuously over the price container for ~500ms, the "Reveal price" button remains `disabled`.

2. **Trusted Event & WebAssembly Proof-of-Work Challenge**:
   - Clicking "Reveal price" triggers `GET /api/challenge`, which returns a WASM binary, salt, and difficulty.
   - The client computes a proof-of-work hash and posts to `POST /api/session`.
   - Crucially, the SPA payload verifies `event.isTrusted === true`. Calling `element.click()` via JavaScript DOM `page.evaluate()` sets `isTrusted: false`, causing the server to return `401 Unauthorized`.

3. **Honeypot Fake Prices & Zero-Width Spaces**:
   - The DOM contains hidden price elements with `aria-hidden="true"` or `style="display: none"` containing fake amounts (e.g. `₹5,038`, `₹5,658`). Naive regex or raw text scrapers will capture these honeypot values.
   - Visible digit text spans contain zero-width space characters (`\u200B`) between digits (e.g., `<span>₹​</span><span>4​</span><span>,​</span><span>6​</span><span>1​</span><span>4</span>`).

4. **Simulated Server Latency & Transient Errors**:
   - The mock store randomly returns delayed responses or attempt failures (e.g. "Couldn't load price after 1 attempts" with a "Try again" button).

---

## 🛠️ How We Made Scraping Bulletproof

1. **Playwright Browser Engine with Real Mouse Traversal**:
   - Rather than relying on simple HTTP fetching (which cannot execute WASM challenges or produce trusted browser events), we use Playwright Chromium in a headless context.
   - We calculate the bounding box of `.price-block` and execute a smooth mouse sweep across coordinates over 600ms, satisfying the `minMoves` and `minDwellMs` requirements.

2. **Trusted Playwright Input Events**:
   - We issue native Playwright `page.click(".price-block button")` calls, ensuring `event.isTrusted === true`. This allows the browser engine to solve the WASM challenge and receive a valid `200 OK` session token.

3. **Honeypot Exclusion & Sanitization Parser**:
   - In `parser.js` and `browserScraper.js`, we query visible DOM containers and explicitly exclude any element where `aria-hidden === 'true'` or `display === 'none'`.
   - All extracted text is sanitized by stripping zero-width unicode characters (`\u200B`, `\u200C`, `\u200D`, `\uFEFF`) before parsing numeric floats.

4. **Automatic In-Page & Function Retries**:
   - If the mock store presents a "Try again" button due to a transient failure, the scraper detects the button, increments the attempt count, and clicks it automatically up to `maxRetries`.
   - Honest logging records whether a run succeeded on attempt 1 (`SUCCESS`), required retry attempts (`RETRIED`), or exceeded limits (`FAILED`).

---

## ⚖️ Trade-Offs Made

| Decision | Pros | Cons |
| :--- | :--- | :--- |
| **Playwright Browser over Axios/Cheerio** | Bypasses WASM proof-of-work challenges & trusted click requirement 100% reliably. | Higher RAM usage (~100-150MB per instance) and slightly longer execution time (~5-10s per item). |
| **External Cron Trigger (`cron-job.org`)** | Operates cleanly on Render free-tier backends that go to sleep after inactivity. | Requires external web service setup rather than in-process `node-cron`. |
| **Real-time Manual Scrape Trigger in Dashboard** | Allows instant verification and demo evaluation during interviews. | Must be rate-limited to avoid browser process exhaustion under heavy manual spamming. |

---

## 💡 What AI Tools Got Wrong & How We Corrected It

1. **Initial Assumption: Simple Axios / Cheerio Scraping**:
   - *First Attempt*: Standard AI scraper prompts suggested using `axios.get()` or `cheerio` parsing.
   - *Correction*: Running curl / raw GET against `https://demo.inelabteamdev.com/product/854` revealed an empty React SPA shell (`<div id="root"></div>`), proving client-side JS rendering and WASM execution were mandatory.

2. **Initial Assumption: Standard `page.evaluate(() => button.click())`**:
   - *Second Attempt*: In Playwright, triggering `.click()` via DOM JS evaluate failed with `401 Unauthorized`.
   - *Correction*: Deep network inspection revealed that the store telemetry payload checked `"trusted": true`. Switching to Playwright native `page.click()` produced genuine browser input events, solving the challenge cleanly.

3. **Initial Assumption: Naive Regex `/\$\d+/` for Price Extraction**:
   - *Third Attempt*: Standard price regex matched hidden honeypot DOM elements (`₹5,038`) or broke on zero-width space characters.
   - *Correction*: We created `cleanText()` to strip `\u200B` characters and updated selector rules to ignore `aria-hidden="true"` nodes.
