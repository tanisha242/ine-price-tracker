import express from "express";
import { supabase } from "../config/supabase.js";
import { scrapeAndLogTrackedProduct } from "../services/scrapeService.js";

const router = express.Router();

/**
 * GET /api/tracked-products
 * Fetch all tracked products with latest price history and scrape logs
 */
router.get("/", async (req, res) => {
  try {
    const { data: trackedList, error } = await supabase
      .from("tracked_products")
      .select(`
        id,
        is_active,
        created_at,
        product:products (
          id,
          sku,
          name,
          brand,
          category,
          product_url,
          image_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Attach latest price_history and scrape_logs for each tracked product
    const enrichedList = await Promise.all(
      (trackedList || []).map(async item => {
        const { data: latestHistory } = await supabase
          .from("price_history")
          .select("*")
          .eq("tracked_product_id", item.id)
          .order("scraped_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: latestLog } = await supabase
          .from("scrape_logs")
          .select("*")
          .eq("tracked_product_id", item.id)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...item,
          latestPrice: latestHistory?.price ?? null,
          latestStockStatus: latestHistory?.stock_status ?? null,
          latestStockQuantity: latestHistory?.stock_quantity ?? null,
          lastScrapedAt: latestLog?.completed_at ?? latestLog?.started_at ?? null,
          lastScrapeStatus: latestLog?.status ?? null
        };
      })
    );

    res.json(enrichedList);
  } catch (err) {
    console.error("Fetch tracked products error:", err);
    res.status(500).json({ error: "Failed to fetch tracked products", message: err.message });
  }
});

/**
 * POST /api/tracked-products
 * Add product to tracked products
 */
router.post("/", async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId is required" });
    }

    // Insert into tracked_products table
    const { data: tracked, error } = await supabase
      .from("tracked_products")
      .upsert({ product_id: productId, is_active: true }, { onConflict: "product_id" })
      .select(`
        id,
        is_active,
        created_at,
        product:products (*)
      `)
      .single();

    if (error) throw error;

    // Trigger initial scrape asynchronously (or synchronously for user feedback)
    scrapeAndLogTrackedProduct(tracked.id).catch(err => {
      console.error(`Initial scrape for ${tracked.id} failed:`, err);
    });

    res.status(201).json(tracked);
  } catch (err) {
    console.error("Add tracked product error:", err);
    res.status(500).json({ error: "Failed to track product", message: err.message });
  }
});

/**
 * GET /api/tracked-products/:id
 * Get detail view for a tracked product including full price history and scrape logs
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data: item, error: itemErr } = await supabase
      .from("tracked_products")
      .select(`
        id,
        is_active,
        created_at,
        product:products (*)
      `)
      .eq("id", id)
      .single();

    if (itemErr || !item) {
      return res.status(404).json({ error: "Tracked product not found" });
    }

    // Fetch full price history
    const { data: history } = await supabase
      .from("price_history")
      .select("*")
      .eq("tracked_product_id", id)
      .order("scraped_at", { ascending: true });

    // Fetch full scrape logs
    const { data: logs } = await supabase
      .from("scrape_logs")
      .select("*")
      .eq("tracked_product_id", id)
      .order("started_at", { ascending: false })
      .limit(100);

    res.json({
      ...item,
      priceHistory: history || [],
      scrapeLogs: logs || []
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product details", message: err.message });
  }
});

/**
 * POST /api/tracked-products/:id/scrape
 * Manually trigger immediate scrape for a tracked product
 */
router.post("/:id/scrape", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await scrapeAndLogTrackedProduct(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Scrape failed", message: err.message });
  }
});

/**
 * DELETE /api/tracked-products/:id
 * Delete/untrack a product
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("tracked_products").delete().eq("id", id);
    if (error) throw error;
    res.json({ message: "Product untracked successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to untrack product", message: err.message });
  }
});

export default router;
