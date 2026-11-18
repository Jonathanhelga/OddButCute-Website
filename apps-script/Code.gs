// OddButCute order backend. Paste this into the Apps Script editor of the Google Sheet that should receive orders (Sheet > Extensions > Apps Script).
// It holds no secrets, so it is safe to keep in the repo.
// Two tables: "Orders" has one row per order, "Items" has one row per item of an order. Both carry the Order ID.

const ORDERS_SHEET = "Orders";
const ITEMS_SHEET = "Items";
const FOLDER_NAME = "OddButCute payment screenshots";
const ORDER_HEADERS = ["Received at", "Order ID", "Name", "WhatsApp", "Email", "Instagram", "Items", "Total", "Payment screenshot", "Bundle discount (IDR)"];
const ITEM_HEADERS = ["Order ID", "Item #", "Product", "Design", "Case type", "Material", "MagSafe", "Phone type", "Model", "Frame colour", "Qty", "Unit price (IDR)", "Line total (IDR)"];
const MAX_IMAGE_CHARS = 1500000;
const MAX_LINES = 30;
const MAX_LINE_QTY = 99;
const MAX_PRICE = 100000000;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const LINE_TEXT_KEYS = ["product", "design", "caseType", "material", "magsafe", "phoneType", "model", "frame"];

// Run this once from the editor. It creates both sheet tabs and the Drive folder, and makes Google ask you for permission.
function setup() {
  getSheet_(ORDERS_SHEET, ORDER_HEADERS);
  getSheet_(ITEMS_SHEET, ITEM_HEADERS);
  getFolder_();
}

// Opening the web app URL in a browser calls this. It only proves the deployment is alive.
function doGet() {return json_({ok: true, service: "OddButCute orders"});}

function doPost(e) {
  try {
    const order = JSON.parse(e.postData.contents);
    if (order.website) {return json_({ok: true});}
    const problem = validate_(order);
    if (problem) {return json_({ok: false, error: problem});}
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const orders = getSheet_(ORDERS_SHEET, ORDER_HEADERS);
      if (orders.createTextFinder(order.id).matchEntireCell(true).findNext()) {return json_({ok: true});}
      const file = getFolder_().createFile(Utilities.newBlob(Utilities.base64Decode(order.screenshot.data), order.screenshot.mime, order.id + extension_(order.screenshot.mime)));
      const items = getSheet_(ITEMS_SHEET, ITEM_HEADERS);
      for (const row of itemRows_(order)) {items.appendRow(row);}
      orders.appendRow([new Date(), order.id, order.name, order.phone, order.email, order.ig || "-", order.items, order.total, file.getUrl(), Number(order.discount) || 0].map(safe_));
    }
    finally {lock.releaseLock();}
    return json_({ok: true});
  }
  catch (err) {
    console.error(err);
    return json_({ok: false, error: "Server error. Please try again."});
  }
}

// Returns an error message, or "" when the order is acceptable.
function validate_(o) {
  if (!o || typeof o !== "object") {return "Bad request.";}
  if (!/^[A-Z]{2,6}-\d{6}-[A-Z0-9]{4,8}$/.test(String(o.id))) {return "Bad order ID.";}
  if (!o.name || String(o.name).length > 100) {return "Please enter your name.";}
  if (!/^[+\d][\d\s\-()]{6,20}$/.test(String(o.phone))) {return "Enter a valid phone number.";}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(o.email)) || String(o.email).length > 120) {return "Enter a valid email address.";}
  if (String(o.ig || "").length > 60) {return "Instagram handle is too long.";}
  if (!o.items || String(o.items).length > 3000) {return "Order is empty.";}
  if (!o.total || String(o.total).length > 40) {return "Missing total.";}
  if (o.discount !== undefined && !(typeof o.discount === "number" && o.discount >= 0 && o.discount <= MAX_PRICE)) {return "Bad discount.";}
  const linesProblem = validateLines_(o.lines);
  if (linesProblem) {return linesProblem;}
  if (!o.screenshot || !ALLOWED_MIME.includes(o.screenshot.mime)) {return "Please upload your payment screenshot (JPG, PNG or WebP).";}
  if (typeof o.screenshot.data !== "string" || o.screenshot.data.length === 0 || o.screenshot.data.length > MAX_IMAGE_CHARS) {return "Screenshot is too large or missing.";}
  return "";
}

// "lines" is optional so that a customer whose browser still has the old site cached can still order (they just get no Items rows).
function validateLines_(lines) {
  if (lines === undefined) {return "";}
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES) {return "Order items are invalid.";}
  for (const line of lines) {
    if (!line || typeof line !== "object") {return "Order items are invalid.";}
    if (!line.product || !line.design) {return "Order items are invalid.";}
    for (const key of LINE_TEXT_KEYS) {if (line[key] !== undefined && String(line[key]).length > 100) {return "An item description is too long.";}}
    if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > MAX_LINE_QTY) {return "Bad item quantity.";}
    if (typeof line.unitPrice !== "number" || !(line.unitPrice >= 0) || line.unitPrice > MAX_PRICE) {return "Bad item price.";}
  }
  return "";
}

// One row per item. A choice that does not apply to the item (e.g. material of a sticker) is left empty.
function itemRows_(o) {
  return (o.lines || []).map((l, i) => [o.id, i + 1, l.product, l.design, l.caseType || "", l.material || "", l.magsafe || "", l.phoneType || "", l.model || "", l.frame || "", l.qty, l.unitPrice, l.qty * l.unitPrice].map(safe_));
}

// A cell starting with = + - @ would be run as a formula by Sheets. A leading apostrophe turns it into plain text.
function safe_(value) {return typeof value === "string" && /^[=+\-@]/.test(value) ? "'" + value : value;}

function extension_(mime) {return mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";}

function json_(obj) {return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}

// Finds or creates the tab, and keeps its header row equal to `headers`, so adding a column here updates the sheet by itself.
function getSheet_(name, headers) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(name) || book.insertSheet(name);
  const range = sheet.getRange(1, 1, 1, headers.length);
  if (range.getValues()[0].join("|") !== headers.join("|")) {range.setValues([headers]).setFontWeight("bold"); sheet.setFrozenRows(1);}
  return sheet;
}

function getFolder_() {
  const found = DriveApp.getFoldersByName(FOLDER_NAME);
  return found.hasNext() ? found.next() : DriveApp.createFolder(FOLDER_NAME);
}
