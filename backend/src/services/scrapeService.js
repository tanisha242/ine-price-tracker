import { supabase } from "../config/supabase.js";
import { scrapeProductPage } from "./scraper/browserScraper.js";

/**
 * Scrapes a single tracked product and records honest outcome into scrape_logs and price_history
 * @param {string} trackedProductId - UUID of tracked product
 * @param {object} options - Scraper options (headless, slowMo, etc.)
 */
export async function scrapeAndLogTrackedProduct(trackedProductId, options = {}) {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  // 1. Fetch tracked product details
  const { data: trackedItem, error: fetchErr } = await supabase
    .from("tracked_products")
    .select(`
      id,
      is_active,
      product:products (
        id,
        sku,
        name,
        product_url
      )
    `)
    .eq("id", trackedProductId)
    .single();

  if (fetchErr || !trackedItem || !trackedItem.product) {
    throw new Error(`Tracked product ${trackedProductId} not found`);
  }

  const productUrl = trackedItem.product.product_url;

  try {
    // 2. Perform Playwright scrape
    const scrapeResult = await scrapeProductPage(productUrl, options);
    const completedAt = new Date().toISOString();
    const totalDurationMs = Date.now() - startTime;

    // 3. Persist valid observation to price_history ONLY on success
    const { error: histErr } = await supabase
      .from("price_history")
      .insert({
        tracked_product_id: trackedProductId,
        price: scrapeResult.price,
        stock_status: scrapeResult.stockStatus,
        stock_quantity: scrapeResult.stockQuantity,
        scraped_at: completedAt
      });

    if (histErr) {
      console.error("[ScrapeService] Error inserting price_history:", histErr);
    }

    // 4. Persist honest scrape log for EVERY attempt
    let lastLogEntry = null;
    const attempts = scrapeResult.attemptsLog || [
      {
        attempt: scrapeResult.attemptCount,
        status: scrapeResult.attemptCount > 1 ? "RETRIED" : "SUCCESS",
        price: scrapeResult.price,
        stockStatus: scrapeResult.stockStatus,
        stockQuantity: scrapeResult.stockQuantity,
        durationMs: totalDurationMs
      }
    ];

    for (const att of attempts) {
      const { data: logEntry, error: logErr } = await supabase
        .from("scrape_logs")
        .insert({
          tracked_product_id: trackedProductId,
          started_at: startedAt,
          completed_at: completedAt,
          attempt: att.attempt,
          status: att.status,
          error_type: att.errorType || null,
          error_message: att.errorMessage || null,
          extracted_price: att.price || (att.status === "SUCCESS" ? scrapeResult.price : null),
          extracted_stock: att.stockStatus || (att.status === "SUCCESS" ? scrapeResult.stockStatus : null),
          extracted_stock_quantity: att.stockQuantity !== undefined ? att.stockQuantity : (att.status === "SUCCESS" ? scrapeResult.stockQuantity : null),
          duration_ms: att.durationMs || totalDurationMs
        })
        .select()
        .single();

      if (logErr) {
        console.error("[ScrapeService] Error inserting scrape_logs entry:", logErr);
      } else {
        lastLogEntry = logEntry;
      }
    }

    const overallStatus = scrapeResult.attemptCount > 1 ? "RETRIED" : "SUCCESS";

    return {
      success: true,
      status: overallStatus,
      price: scrapeResult.price,
      stockStatus: scrapeResult.stockStatus,
      stockQuantity: scrapeResult.stockQuantity,
      attempt: scrapeResult.attemptCount,
      durationMs: totalDurationMs,
      log: lastLogEntry
    };
  } catch (scrapeErr) {
    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    console.error(`[ScrapeService] Scrape failed for ${productUrl}:`, scrapeErr.message);

    // Persist failure honestly in scrape_logs
    const { data: logEntry, error: logErr } = await supabase
      .from("scrape_logs")
      .insert({
        tracked_product_id: trackedProductId,
        started_at: startedAt,
        completed_at: completedAt,
        attempt: scrapeErr.attempt || 1,
        status: "FAILED",
        error_type: scrapeErr.errorType || "SCRAPE_FAILED",
        error_message: scrapeErr.message,
        duration_ms: durationMs
      })
      .select()
      .single();

    if (logErr) {
      console.error("[ScrapeService] Error inserting failure log:", logErr);
    }

    return {
      success: false,
      status: "FAILED",
      error: scrapeErr.message,
      durationMs,
      log: logEntry
    };
  }
}

/**
 * Scrapes all active tracked products (triggered by scheduled cron job)
 */
export async function scrapeAllActiveProducts(options = {}) {
  const startTime = Date.now();

  const { data: activeTracked, error } = await supabase
    .from("tracked_products")
    .select("id")
    .eq("is_active", true);

  if (error || !activeTracked) {
    throw new Error(`Failed to fetch active tracked products: ${error?.message}`);
  }

  const results = [];
  for (const item of activeTracked) {
    const res = await scrapeAndLogTrackedProduct(item.id, options);
    results.push({ trackedProductId: item.id, ...res });
  }

  const durationMs = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;

  return {
    totalTracked: activeTracked.length,
    successCount,
    failedCount: activeTracked.length - successCount,
    durationMs,
    results
  };
}
