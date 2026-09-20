import { createElement } from "react";
import { getProductIcon } from "../utils/productIcon";

export function ProductCategoryIcon({ productName = "", category = "", size = 20, className = "", style = {} }) {
  return createElement(getProductIcon(productName, category), { size, className, style });
}
