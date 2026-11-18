export const $ = selector => document.querySelector(selector);

const HTML_ESCAPES = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"};
export const escapeHtml = text => String(text).replace(/[&<>"']/g, c => HTML_ESCAPES[c]);

export const formatIdr = amount => "IDR " + amount.toLocaleString("en-US");

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

let toastTimer;
export function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1600);
}
