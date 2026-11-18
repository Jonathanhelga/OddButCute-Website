import {CATEGORIES, MATERIALS, STANDARD_CASE_PRICE} from "./config.js";
import {cart, selection} from "./state.js";

export const findMaterial = name => MATERIALS.find(m => m.name === name);
export const premiumFromPrice = () => Math.min(...MATERIALS.map(m => m.price));
export const caseFromPrice = () => Math.min(STANDARD_CASE_PRICE, premiumFromPrice());

export function casePrice() {
  if (selection.tier !== "Premium") {return STANDARD_CASE_PRICE;}
  const material = findMaterial(selection.material);
  if (!material) {return premiumFromPrice();}
  return selection.magsafe === "MagSafe" && material.magsafePrice ? material.magsafePrice : material.price;
}

export const qtyInCart = category => cart.filter(item => item.category === category).reduce((sum, item) => sum + item.qty, 0);

// Cost of `count` pieces of a bundle category: full bundles at the bundle price, the rest at the single price.
export function bundleCost(category, count) {
  const {price, bundle} = CATEGORIES[category];
  return Math.floor(count / bundle.size) * bundle.price + (count % bundle.size) * price;
}

const BUNDLE_CATEGORIES = Object.keys(CATEGORIES).filter(k => CATEGORIES[k].bundle);
export const BUNDLE_LABEL = BUNDLE_CATEGORIES.map(k => CATEGORIES[k].name).join(" & ");

export const bundleSavings = () => BUNDLE_CATEGORIES.reduce((sum, k) => sum + qtyInCart(k) * CATEGORIES[k].price - bundleCost(k, qtyInCart(k)), 0);

export function orderTotal() {
  const regular = cart.filter(item => !CATEGORIES[item.category].bundle).reduce((sum, item) => sum + item.price * item.qty, 0);
  return regular + BUNDLE_CATEGORIES.reduce((sum, k) => sum + bundleCost(k, qtyInCart(k)), 0);
}
