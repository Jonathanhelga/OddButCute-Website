// Puts the shop name and Instagram handle from settings.js into the page.
import {SETTINGS} from "./settings.js";
import {$} from "./utils.js";

export function applyBranding() {
  const {shopName, instagram} = SETTINGS;
  document.title = `${shopName} · Order Form`;
  $(".brand img").alt = `${shopName} logo`;
  $(".qris").alt = `QRIS payment code for ${shopName}`;
  $("footer").textContent = `made with ♡ by ${shopName} · ${instagram}`;
}
