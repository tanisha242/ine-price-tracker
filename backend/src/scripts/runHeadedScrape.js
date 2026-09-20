import { scrapeProductPage } from "../services/scraper/browserScraper.js";

async function main() {
  const targetUrl = process.argv[2] || "https://demo.inelabteamdev.com/product/854";

  console.log("=================================================");
  console.log("🎥 OBSERVABLE (HEADED) SCRAPER RUN DEMO");
  console.log("=================================================");
  console.log(`Target URL: ${targetUrl}`);
  console.log("Launching Chromium in HEADED mode (headless: false)...");
  console.log("Watch the browser window to observe mouse movement & trusted click!");
  console.log("-------------------------------------------------\n");

  try {
    const result = await scrapeProductPage(targetUrl, {
      headless: false,
      slowMo: 150
    });

    console.log("\n=================================================");
    console.log("🎉 SCRAPE SUCCESSFUL!");
    console.log("=================================================");
    console.log(`Extracted Price:    ₹${result.price}`);
    console.log(`Stock Status:       ${result.stockStatus}`);
    console.log(`Stock Quantity:     ${result.stockQuantity ?? "N/A"}`);
    console.log(`Attempts Taken:     ${result.attemptCount}`);
    console.log(`Duration:           ${result.durationMs} ms`);
    console.log("=================================================\n");
  } catch (err) {
    console.error("\n=================================================");
    console.error("❌ SCRAPE FAILED!");
    console.error("=================================================");
    console.error(`Error Type:    ${err.errorType || "UNKNOWN"}`);
    console.error(`Error Message: ${err.message}`);
    console.error("=================================================\n");
  }
}

main();
