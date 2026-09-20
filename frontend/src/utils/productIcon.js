import {
  Keyboard,
  CupSoda,
  Smartphone,
  Headphones,
  Camera,
  Watch,
  ShoppingBag,
  Footprints,
  BookOpen,
  Gamepad2,
  Shirt,
  Wrench,
  Package
} from "lucide-react";

/**
 * Returns the Lucide Icon component matching the product name or category keywords.
 * Performs case-insensitive matching against defined product categories.
 * 
 * @param {string} productName 
 * @param {string} category 
 * @returns {import('lucide-react').LucideIcon} Lucide Icon component
 */
export function getProductIcon(productName = "", category = "") {
  const nameStr = (productName || "").toLowerCase();
  const catStr = (category || "").toLowerCase();
  const fullText = `${nameStr} ${catStr}`;

  // 1. Keyboard / Numpad / Mouse / Computer / Laptop / Monitor
  if (/(keyboard|numpad|keypad|mouse|computer|laptop|monitor|desktop|pc|macbook)/.test(fullText)) {
    return Keyboard;
  }

  // 2. Bottle / Water / Kitchen
  if (/(bottle|water|kitchen|cup|flask|tumbler|beverage|drink|utensil|mug|cookware)/.test(fullText)) {
    return CupSoda;
  }

  // 3. Phone / Mobile
  if (/(phone|mobile|smartphone|iphone|android|cellular)/.test(fullText)) {
    return Smartphone;
  }

  // 4. Headphones / Audio / Speaker
  if (/(headphone|headphones|headset|earbud|earbuds|audio|speaker|sound|earphone|earphones|pod)/.test(fullText)) {
    return Headphones;
  }

  // 5. Camera / Photography
  if (/(camera|photo|photography|lens|webcam|camcorder)/.test(fullText)) {
    return Camera;
  }

  // 6. Watch / Clock
  if (/(watch|clock|timepiece|smartwatch|chronograph)/.test(fullText)) {
    return Watch;
  }

  // 7. Bag / Backpack
  if (/(bag|backpack|handbag|tote|duffel|luggage|wallet|pouch|briefcase|pack)/.test(fullText)) {
    return ShoppingBag;
  }

  // 8. Shoes / Footwear
  if (/(shoe|shoes|footwear|sneaker|sneakers|boot|boots|sandal|sandals|kick)/.test(fullText)) {
    return Footprints;
  }

  // 9. Book / Notebook / Stationery
  if (/(book|books|notebook|stationery|journal|paper|pen|pencil|planner)/.test(fullText)) {
    return BookOpen;
  }

  // 10. Game / Gaming
  if (/(game|gaming|gamepad|console|controller|playstation|xbox|nintendo|joystick)/.test(fullText)) {
    return Gamepad2;
  }

  // 11. Clothing / Shirt
  if (/(clothing|shirt|t-shirt|tshirt|apparel|pants|jacket|hoodie|wear|top|tee)/.test(fullText)) {
    return Shirt;
  }

  // 12. Tools / Hardware
  if (/(tool|tools|hardware|wrench|screwdriver|drill|hammer|pliers|driver)/.test(fullText)) {
    return Wrench;
  }

  // Fallback
  return Package;
}
