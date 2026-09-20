import { supabase } from "../config/supabase.js";

const STORE_BASE_URL = process.env.STORE_BASE_URL || "https://demo.inelabteamdev.com";

/**
 * Searches or fetches catalog from INE mock store API
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @param {number} pageSize - Page size
 */
export async function searchStoreCatalog(query = "", page = 1, pageSize = 20) {
  const url = new URL("/api/catalog", STORE_BASE_URL);
  if (query) url.searchParams.set("q", query);
  url.searchParams.set("page", page.toString());
  url.searchParams.set("pageSize", pageSize.toString());

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Catalog search failed with status ${response.status}`);
  }

  const data = await response.json();
  const items = data.items || [];

  if (items.length === 0) {
    return { items: [], total: 0, page, pageSize };
  }

  // 1. Prepare products for upsert
  const productsToUpsert = items.map(item => ({
    sku: item.sku || `SKU-${item.id}`,
    name: item.name,
    brand: item.brand || null,
    category: item.category || null,
    product_url: `${STORE_BASE_URL}/product/${item.id}`,
    image_url: item.image_url || null,
    updated_at: new Date().toISOString()
  }));

  // 2. Upsert into Supabase
  const { data: upsertedData, error } = await supabase
    .from("products")
    .upsert(productsToUpsert, { onConflict: "sku" })
    .select();

  if (error) {
    console.error("[CatalogCrawler] Supabase upsert error:", error);
    // Fallback query by SKUs
    const skus = productsToUpsert.map(p => p.sku);
    const { data: fallbackData } = await supabase.from("products").select("*").in("sku", skus);
    return {
      items: fallbackData || [],
      total: data.total || items.length,
      page,
      pageSize
    };
  }

  return {
    items: upsertedData || [],
    total: data.total || items.length,
    page,
    pageSize
  };
}
