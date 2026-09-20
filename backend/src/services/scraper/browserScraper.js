import { chromium } from "playwright";
import { SELECTORS } from "./selectors.js";
import { cleanText, parsePrice, parseStock } from "./parser.js";
import { ScrapeError, NavigationTimeoutError, SelectorNotFoundError, PriceExtractionError } from "./errors.js";

/**
 * Scrapes price and stock from INE store product page using Playwright
 * @param {string} productUrl - Full URL to product page
 * @param {object} options - Options: { headless, slowMo, maxRetries }
 */
export async function scrapeProductPage(productUrl, options = {}) {
  const isHeadless = options.headless ?? true;
  const slowMo = options.slowMo ?? 0;
  const timeout = options.timeout ?? 25000;
  const startTime = Date.now();

  let browser;
  let attemptCount = 1;

  try {
    browser = await chromium.launch({
      headless: isHeadless,
      slowMo: slowMo,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    });

    const page = await context.newPage();
    page.setDefaultTimeout(timeout);

    // 1. Navigate to product URL
    try {
      await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout });
    } catch (navErr) {
      throw new NavigationTimeoutError(`Failed to load ${productUrl}: ${navErr.message}`);
    }

    await page.waitForTimeout(1000);

    // 1b. Inject CSS to completely suppress cookie overlay pointer interception
    await page.addStyleTag({
      content: ".cookie-overlay, [class*='cookie-overlay'], [class*='cookie_overlay'], div[style*='z-index: 999'] { display: none !important; pointer-events: none !important; visibility: hidden !important; }"
    }).catch(() => {});

    // 2. Locate .price-block
    const priceBlock = page.locator(SELECTORS.priceBlock);
    if ((await priceBlock.count()) === 0) {
      throw new SelectorNotFoundError(SELECTORS.priceBlock);
    }

    const box = await priceBlock.boundingBox();
    if (!box) {
      throw new ScrapeError("Price block element is not visible or zero size", "ELEMENT_INVISIBLE");
    }

    // 3. Humanness check: Smooth mouse movement & dwell time over .price-block
    const steps = 25;
    const startX = box.x + 15;
    const endX = box.x + box.width - 15;
    const midY = box.y + box.height / 2;

    for (let i = 0; i <= steps; i++) {
      const currentX = startX + ((endX - startX) * i) / steps;
      const currentY = midY + (i % 2 === 0 ? 5 : -5);
      await page.mouse.move(currentX, currentY);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(600);

    // 4. Native trusted click on "Reveal price" button
    const revealBtn = page.locator(SELECTORS.revealButton).first();
    if (await revealBtn.count() > 0 && await revealBtn.isVisible()) {
      await revealBtn.click({ timeout: 15000 });
    } else {
      await page.click(SELECTORS.priceBlock);
    }

    // 5. Poll for price reveal or "Try again" button
    let priceFound = null;
    let stockFound = null;
    const attemptsLog = [];
    let currentAttemptStart = Date.now();

    const maxPollSec = 12;
    for (let sec = 1; sec <= maxPollSec; sec++) {
      await page.waitForTimeout(1000);

      // Check if "Try again" button is visible (store transient error state)
      const tryAgainBtn = page.locator(SELECTORS.tryAgainButton);
      if (await tryAgainBtn.count() > 0 && await tryAgainBtn.isVisible()) {
        attemptsLog.push({
          attempt: attemptCount,
          status: "RETRIED",
          errorType: "TRANSIENT_STORE_FAILURE",
          errorMessage: "Store returned temporary 'Try again' failure state",
          durationMs: Date.now() - currentAttemptStart
        });

        attemptCount++;
        currentAttemptStart = Date.now();
        console.log(`[Scraper] 'Try again' detected (attempt ${attemptCount}). Clicking...`);
        await tryAgainBtn.click();
        await page.waitForTimeout(1000);
        continue;
      }

      // Extract visible current selling price specifically targeting .price-main > b or .price-main [class*='pv-']
      const extractedData = await page.evaluate(() => {
        const priceBlockEl = document.querySelector(".price-block");
        if (!priceBlockEl) return null;

        // Target selling-price element: .price-main > b, .price-main b, or [class*='pv-'] inside .price-main
        const candidates = Array.from(priceBlockEl.querySelectorAll(".price-main > b, .price-main b, .price-main [class*='pv-']"));
        const visibleB = candidates.find(el => {
          const style = window.getComputedStyle(el);
          const isVisible = style.display !== "none" && style.visibility !== "hidden";
          const isAriaHidden = el.getAttribute("aria-hidden") === "true" || !!el.closest("[aria-hidden='true']");

          // Reject crossed-out MRP [class*='mr-'] or text-decoration: line-through
          const textDecLine = style.textDecorationLine || "";
          const textDec = style.textDecoration || "";
          const isCrossedOut = textDecLine.includes("line-through") || 
                               textDec.includes("line-through") ||
                               el.matches("[class*='mr-']") || 
                               !!el.closest("[class*='mr-']");

          // Reject honeypot .price-value
          const isHoneypot = el.classList.contains("price-value") || el.matches("[class*='price-value']");

          const hasText = el.innerText && el.innerText.trim().length > 0;
          return isVisible && !isAriaHidden && !isCrossedOut && !isHoneypot && hasText;
        });

        const rawPriceText = visibleB ? visibleB.innerText.trim() : "";

        // Extract stock text
        const stockBadgeEl = priceBlockEl.querySelector(".stock-badge, [class*='st-']");
        const stockText = stockBadgeEl ? stockBadgeEl.innerText : priceBlockEl.innerText;

        return { rawPriceText, stockText };
      });

      if (extractedData && extractedData.rawPriceText) {
        const parsedP = parsePrice(extractedData.rawPriceText);
        if (parsedP !== null && parsedP > 0) {
          priceFound = parsedP;
          stockFound = parseStock(extractedData.stockText);

          attemptsLog.push({
            attempt: attemptCount,
            status: "SUCCESS",
            price: priceFound,
            stockStatus: stockFound.stockStatus,
            stockQuantity: stockFound.stockQuantity,
            durationMs: Date.now() - currentAttemptStart
          });
          break;
        }
      }
    }

    if (priceFound === null) {
      attemptsLog.push({
        attempt: attemptCount,
        status: "FAILED",
        errorType: "PRICE_EXTRACTION_FAILED",
        errorMessage: "Could not extract valid price after reveal attempts",
        durationMs: Date.now() - currentAttemptStart
      });
      throw new PriceExtractionError("Could not extract valid price after reveal attempts");
    }

    const durationMs = Date.now() - startTime;

    return {
      price: priceFound,
      stockStatus: stockFound.stockStatus,
      stockQuantity: stockFound.stockQuantity,
      attemptCount,
      attemptsLog,
      durationMs
    };
  } catch (err) {
    if (err instanceof ScrapeError) throw err;
    throw new ScrapeError(`Scrape failed: ${err.message}`, "SCRAPE_FAILED");
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
