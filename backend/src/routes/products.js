import express from "express";
import { searchStoreCatalog } from "../services/catalogCrawler.js";
import { supabase } from "../config/supabase.js";

const router = express.Router();

/**
 * GET /api/products/search?q=...
 * Search products table in Supabase catalog
 */
router.get("/search", async (req, res) => {
  try {
    const rawQuery = req.query.q || "";
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize || "20", 10)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Clean whitespace
    const q = rawQuery.trim().replace(/\s+/g, " ");

    let queryBuilder = supabase.from("products").select("*", { count: "exact" });

    if (q.length > 0) {
      // Escape special characters for PostgREST filter syntax
      const safeQ = q.replace(/[%_\\]/g, "\\$&").replace(/[,()]/g, "");
      const pattern = `%${safeQ}%`;
      queryBuilder = queryBuilder.or(
        `name.ilike.${pattern},sku.ilike.${pattern},brand.ilike.${pattern},category.ilike.${pattern}`
      );
    }

    const { data: items, count, error } = await queryBuilder
      .order("name", { ascending: true })
      .range(from, to);

    if (error) {
      throw error;
    }

    // Fallback search via store crawler if query returned 0 items from database
    if (q.length > 0 && (!items || items.length === 0)) {
      try {
        const fallbackCatalog = await searchStoreCatalog(q, page, pageSize);
        if (fallbackCatalog && fallbackCatalog.items && fallbackCatalog.items.length > 0) {
          const lowerQ = q.toLowerCase();
          const filteredFallback = fallbackCatalog.items.filter(item => {
            return (
              (item.name && item.name.toLowerCase().includes(lowerQ)) ||
              (item.sku && item.sku.toLowerCase().includes(lowerQ)) ||
              (item.brand && item.brand.toLowerCase().includes(lowerQ)) ||
              (item.category && item.category.toLowerCase().includes(lowerQ))
            );
          });
          return res.json({
            items: filteredFallback,
            total: filteredFallback.length,
            page,
            pageSize
          });
        }
      } catch (crawlerErr) {
        console.warn("[Products API] Fallback crawler error:", crawlerErr.message);
      }
    }

    res.json({
      items: items || [],
      total: count !== null ? count : (items || []).length,
      page,
      pageSize
    });
  } catch (err) {
    console.error("Catalog search error:", err);
    res.status(500).json({ error: "Failed to search product catalog", message: err.message });
  }
});

/**
 * GET /api/products
 * Get list of cached products
 */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", message: err.message });
  }
});

export default router;
