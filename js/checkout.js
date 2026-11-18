// Step 4: checking the order, then showing the QRIS code and the link to the prefilled Google Form.
import {CATEGORIES, GOOGLE_FORM} from "./config.js";
import {cart} from "./state.js";
import {BUNDLE_LABEL, bundleSavings, orderTotal, qtyInCart} from "./pricing.js";
import {fieldValue} from "./customer.js";
import {$, formatIdr} from "./utils.js";

// A message when a category with a minimum is in the cart below that minimum, otherwise "".
function minimumProblem() {
  let problem = "";
  for (const [key, c] of Object.entries(CATEGORIES)) {
    const n = qtyInCart(key);
    if (c.min > 1 && n && n < c.min) {problem = `${c.name}s: minimum buy ${c.min} (you have ${n}).`;}
  }
  return problem;
}

// Marks every invalid field red and scrolls to the first one. Returns true when the order can go ahead.
function validateOrder() {
  let firstBad = null;
  const check = (id, ok) => {
    const field = $("#" + id);
    field.classList.toggle("bad", !ok);
    if (!ok && !firstBad) {firstBad = field;}
  };
  const minProblem = minimumProblem();
  $("#f-cart small").textContent = minProblem || "Add at least one item to your order.";
  check("f-cart", cart.length > 0 && !minProblem);
  check("f-name", fieldValue("name").length >= 2);
  check("f-phone", fieldValue("phone").replace(/\D/g, "").length >= 9);
  check("f-email", /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fieldValue("email")));
  firstBad?.scrollIntoView({block: "center"});
  return !firstBad;
}

// e.g. "OBC-261118-K3ZQ": shop prefix, date as YYMMDD, 4 random characters.
function newOrderId() {
  const now = new Date(), pad = n => String(n).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `OBC-${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${random}`;
}

// One line per cart item, e.g. "1. Puffy Pouch – Blue Stripe x2 = IDR 118,000".
function orderSummaryText() {
  const lines = cart.map((item, i) => `${i + 1}. ${item.name}${item.detail ? ` (${item.detail})` : ""} x${item.qty} = ${formatIdr(item.price * item.qty)}`);
  const savings = bundleSavings();
  if (savings > 0) {lines.push(`${BUNDLE_LABEL} bundle discount: -${formatIdr(savings)}`);}
  return lines.join("\n");
}

// A Google Form link with the answers already filled in: ?usp=pp_url&entry.<question id>=<answer>&...
function prefilledFormUrl(orderId) {
  const ig = fieldValue("ig").replace(/^@/, "");
  const answers = {id: orderId, name: fieldValue("name"), phone: fieldValue("phone"), email: fieldValue("email"), ig: ig ? "@" + ig : "-", items: orderSummaryText(), total: formatIdr(orderTotal())};
  const params = Object.entries(GOOGLE_FORM.fields).map(([field, entry]) => `entry.${entry}=${encodeURIComponent(answers[field])}`);
  return `${GOOGLE_FORM.url}?usp=pp_url&${params.join("&")}`;
}

export function showReview() {
  if (!validateOrder()) {return;}
  const orderId = newOrderId();
  $("#order-id").textContent = orderId;
  $("#pay-total").textContent = formatIdr(orderTotal());
  $("#form-link").href = prefilledFormUrl(orderId);
  document.body.classList.add("reviewing");
  $("#review").scrollIntoView({block: "start"});
}

export function editOrder() {
  document.body.classList.remove("reviewing");
  $("#step-order").scrollIntoView();
}
