// Step 2: the list of items in the order and the total.
import {MAX_QTY} from "./config.js";
import {cart} from "./state.js";
import {BUNDLE_LABEL, bundleSavings, orderTotal} from "./pricing.js";
import {stepper, thumbnail} from "./components.js";
import {$, clamp, escapeHtml, formatIdr} from "./utils.js";

export function renderCart() {
  const list = $("#cart");
  if (!cart.length) {list.innerHTML = `<li class="empty">Your order is empty. Add something cute above ♡</li>`;}
  else {list.innerHTML = cart.map((item, i) => `<li>${thumbnail(item.img, item.imageFit)}<div class="t"><b>${escapeHtml(item.name)}</b><small>${item.detail ? escapeHtml(item.detail) + " · " : ""}${formatIdr(item.price)}</small></div>${stepper("cart", item.qty, i)}<button class="x" data-remove="${i}" aria-label="Remove">×</button></li>`).join("");}

  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  $("#cart-count").textContent = count ? `(${count} item${count > 1 ? "s" : ""})` : "";
  $("#cart-total").textContent = formatIdr(orderTotal());
  const savings = bundleSavings();
  $("#cart-discount").textContent = savings > 0 ? `${BUNDLE_LABEL} bundle applied: you save ${formatIdr(savings)}.` : "";
  if (count) {$("#f-cart").classList.remove("bad");}
}

export function stepCartQty(index, delta) {
  const item = cart[index];
  item.qty = clamp(item.qty + delta, 1, MAX_QTY);
  renderCart();
}

export function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}
