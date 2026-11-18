// Step 4: checking the order, showing the QRIS code, then sending the order and payment screenshot.
import {CATEGORIES} from "./config.js";
import {SETTINGS} from "./settings.js";
import {cart} from "./state.js";
import {BUNDLE_LABEL, bundleSavings, orderTotal, qtyInCart} from "./pricing.js";
import {fieldValue} from "./customer.js";
import {resizedScreenshot} from "./screenshot.js";
import {$, formatIdr} from "./utils.js";

const SUBMIT_LABEL = "I've paid, submit my order";
const GENERIC_ERROR = "We could not send your order. Check your connection and try again, or use the Google Form below.";
let currentOrderId = "";

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

// e.g. "OBC-261118-K3ZQ": shop prefix from settings.js, date as YYMMDD, 4 random characters.
function newOrderId() {
  const now = new Date(), pad = n => String(n).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${SETTINGS.orderPrefix}-${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${random}`;
}

// One line per cart item, e.g. "1. Puffy Pouch – Blue Stripe x2 = IDR 118,000".
function orderSummaryText() {
  const lines = cart.map((item, i) => `${i + 1}. ${item.name}${item.detail ? ` (${item.detail})` : ""} x${item.qty} = ${formatIdr(item.price * item.qty)}`);
  const savings = bundleSavings();
  if (savings > 0) {lines.push(`${BUNDLE_LABEL} bundle discount: -${formatIdr(savings)}`);}
  return lines.join("\n");
}

// The answers for one order, keyed by field name (the same keys as SETTINGS.googleForm.fields).
function orderAnswers(orderId) {
  const ig = fieldValue("ig").replace(/^@/, "");
  return {id: orderId, name: fieldValue("name"), phone: fieldValue("phone"), email: fieldValue("email"), ig: ig ? "@" + ig : "-", items: orderSummaryText(), total: formatIdr(orderTotal())};
}

// One entry per cart line with every choice as its own field, for the Items table in the Sheet. Prices are plain numbers.
const orderLines = () => cart.map(item => ({product: item.product, design: item.design, ...item.attrs, qty: item.qty, unitPrice: item.price}));

// Fallback only: a Google Form link with the answers already filled in: ?usp=pp_url&entry.<question id>=<answer>&...
function prefilledFormUrl(orderId) {
  const answers = orderAnswers(orderId);
  const params = Object.entries(SETTINGS.googleForm.fields).map(([field, entry]) => `entry.${entry}=${encodeURIComponent(answers[field])}`);
  return `${SETTINGS.googleForm.url}?usp=pp_url&${params.join("&")}`;
}

export function showReview() {
  if (!validateOrder()) {return;}
  currentOrderId = newOrderId();
  $("#order-id").textContent = currentOrderId;
  $("#pay-total").textContent = formatIdr(orderTotal());
  $("#form-link").href = prefilledFormUrl(currentOrderId);
  $("#submit-error").hidden = true;
  $("#fallback").hidden = true;
  document.body.classList.add("reviewing");
  $("#review").scrollIntoView({block: "start"});
}

export function editOrder() {
  document.body.classList.remove("reviewing");
  $("#step-order").scrollIntoView();
}

function setSubmitting(on) {
  const button = $("#submit-order");
  button.disabled = on;
  button.textContent = on ? "Submitting..." : SUBMIT_LABEL;
}

// Only errors we wrote ourselves (name "Error") are safe to show. fetch, timeout and JSON failures have other names and get the generic message.
function showSubmitError(err) {
  $("#submit-error").textContent = err.name === "Error" ? err.message : GENERIC_ERROR;
  $("#submit-error").hidden = false;
  $("#fallback").hidden = false;
}

function showDone() {
  $("#done-id").textContent = currentOrderId;
  document.body.classList.add("submitted");
  window.scrollTo(0, 0);
}

// Sends the order and the shrunken screenshot to the Apps Script web app. text/plain skips the browser's CORS preflight. The server ignores a repeated order ID, so retrying is safe.
export async function submitOrder() {
  const file = $("#screenshot").files[0];
  $("#f-screenshot").classList.toggle("bad", !file);
  if (!file) {$("#f-screenshot").scrollIntoView({block: "center"}); return;}
  $("#submit-error").hidden = true;
  setSubmitting(true);
  try {
    const screenshot = await resizedScreenshot(file);
    const body = JSON.stringify({...orderAnswers(currentOrderId), lines: orderLines(), discount: bundleSavings(), screenshot, website: $("#hp-note").value});
    const response = await fetch(SETTINGS.appsScriptUrl, {method: "POST", headers: {"Content-Type": "text/plain"}, body, signal: AbortSignal.timeout(30000)});
    const result = await response.json();
    if (!result.ok) {throw new Error(result.error);}
    showDone();
  }
  catch (err) {showSubmitError(err);}
  finally {setSubmitting(false);}
}
