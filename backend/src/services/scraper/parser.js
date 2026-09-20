/**
 * Cleans string by removing zero-width spaces and trimming whitespace.
 */
export function cleanText(str) {
  if (!str) return "";
  return str.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

/**
 * Parses numeric price from text (e.g., "₹4,614" -> 4614.00)
 */
export function parsePrice(priceText) {
  if (!priceText) return null;
  const cleaned = cleanText(priceText);
  // Match numbers with commas/decimals
  const match = cleaned.match(/[\d,]+(\.\d+)?/);
  if (!match) return null;
  const numStr = match[0].replace(/,/g, "");
  const val = parseFloat(numStr);
  return isNaN(val) ? null : val;
}

/**
 * Parses stock text into status and quantity
 */
export function parseStock(stockText) {
  if (!stockText) {
    return { stockStatus: "UNKNOWN", stockQuantity: null };
  }
  const cleaned = cleanText(stockText).toLowerCase();

  if (cleaned.includes("out of stock") || cleaned.includes("sold out") || cleaned.includes("unavailable")) {
    return { stockStatus: "OUT_OF_STOCK", stockQuantity: 0 };
  }

  // Check for quantity like "Only 46 left" or "46 in stock"
  const qtyMatch = cleaned.match(/(\d+)\s*(left|in stock|units)/);
  if (qtyMatch) {
    const qty = parseInt(qtyMatch[1], 10);
    return { stockStatus: "IN_STOCK", stockQuantity: qty };
  }

  if (cleaned.includes("in stock") || cleaned.includes("available")) {
    return { stockStatus: "IN_STOCK", stockQuantity: null };
  }

  return { stockStatus: "IN_STOCK", stockQuantity: null };
}
