/**
 * Selectors for INE Store scraping
 */
export const SELECTORS = {
  priceBlock: ".price-block",
  priceStatus: ".price-status",
  priceSubstatus: ".price-substatus",
  revealButton: ".price-block button, button:has-text('Reveal price')",
  tryAgainButton: "button:has-text('Try again')",
  refreshButton: "button:has-text('Refresh price')",
  
  // Current selling price element selector (.price-main > b)
  currentPrice: ".price-main > b, .price-main b, .price-main [class*='pv-']",
  priceValueContainer: "[class*='pv-']",
  stockBadge: ".stock-badge, [class*='st-']",
  mrp: "[class*='mr-']",
  saleBadge: "[class*='bd-']",
  seller: "[class*='sr-']",
  delivery: "[class*='dl-']",
  rating: "[class*='rt-']",
  
  productTitle: "h1",
  productBrandSku: ".detail-brand",
  productCategory: ".tile-category",
  productDesc: ".detail-desc"
};
