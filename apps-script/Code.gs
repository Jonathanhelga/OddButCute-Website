// OddButCute order backend. Paste this into the Apps Script editor of the Google Sheet that should receive orders (Sheet > Extensions > Apps Script).
// It holds no secrets, so it is safe to keep in the repo.
// Three tables: "Orders" (one row per order), "Items" (one row per line item + discount), and "Summary" (automated quantity totals).

const ORDERS_SHEET = "Orders";
const ITEMS_SHEET = "Items";
const SUMMARY_SHEET = "Summary";
const FOLDER_NAME = "OddButCute payment screenshots";

const ORDER_HEADERS = [
  "Order ID", "Received at", "Name", "WhatsApp", "Email", "Instagram",
  "Total", "Screenshot", "Payment status", "Order status", "Tracking no", "Notes"
];
const ITEM_HEADERS = [
  "Order ID", "Line #", "Product", "Design", "Series", "Case type",
  "Material", "MagSafe", "Phone type", "Phone model", "Frame", "Qty", "Unit price", "Line total"
];

const ORDER_WIDTHS = [150, 140, 140, 130, 180, 120, 100, 220, 120, 110, 140, 200];
const ITEM_WIDTHS = [150, 65, 110, 160, 120, 95, 115, 80, 95, 140, 80, 60, 100, 100];
const SUMMARY_WIDTHS = [120, 180, 110, 40, 120, 110];

const PAYMENT_STATUSES = ["Waiting", "Paid", "Wrong amount", "Refunded"];
const ORDER_STATUSES = ["New", "Packing", "Shipped", "Done", "Cancelled"];

const SUMMARY_PRODUCTS = ["Phone Case", "Puffy Pouch", "Polka Bag", "Sticker", "Phone Strap"];
const PRODUCT_COLOURS = {
  "Phone Case": "#E6E0F8",
  "Puffy Pouch": "#FADADD",
  "Polka Bag": "#FFE5D0",
  "Sticker": "#FFF7C2",
  "Phone Strap": "#D8F3E3",
  "Discount": "#FFF7C2"
};

const MAX_IMAGE_CHARS = 1500000;
const MAX_LINES = 30;
const MAX_LINE_QTY = 99;
const MAX_PRICE = 100000000;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const WHATSAPP_INDEX = 3;
// Keep these prices identical to js/config.js. The server recomputes every price so a browser cannot choose its own.
const FIXED_PRICES = {"Puffy Pouch": 59000, "Polka Bag": 169900, "Sticker": 6000, "Phone Strap": 29000};
const STANDARD_CASE_PRICE = 85000;
const PREMIUM_MATERIALS = {"Epoxy": {price: 139900}, "Glossy Glass": {price: 139900, magsafePrice: 149900}, "Doff": {price: 139900, magsafePrice: 149900}, "Leather": {price: 149900, magsafePrice: 159900}};
const STICKER_BUNDLE_SIZE = 5;
const STICKER_BUNDLE_PRICE = 25000;
const LINE_TEXT_KEYS = ["product", "design", "series", "caseType", "material", "magsafe", "phoneType", "model", "frame"];

// Run this once from the editor. It creates and formats all sheet tabs and the Drive folder, and prompts for permissions.
function setup() {
  const orders = getSheet_(ORDERS_SHEET, ORDER_HEADERS);
  formatOrdersSheet_(orders);

  const items = getSheet_(ITEMS_SHEET, ITEM_HEADERS);
  formatItemsSheet_(items);

  setupSummary_();
  getFolder_();
}

// Opening the web app URL in a browser calls this. It only proves the deployment is alive.
function doGet() {
  return json_({ok: true, service: "OddButCute orders"});
}

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
      const items = getSheet_(ITEMS_SHEET, ITEM_HEADERS);
      const inOrders = orders.createTextFinder(order.id).matchEntireCell(true).findNext();
      const inItems = items.createTextFinder(order.id).matchEntireCell(true).findNext();
      // Orders row first, Items rows second. A retry after a half-finished attempt only writes what is missing, so nothing is duplicated.
      if (!inOrders) {
        const file = getFolder_().createFile(Utilities.newBlob(Utilities.base64Decode(order.screenshot.data), order.screenshot.mime, order.id + extension_(order.screenshot.mime)));
        orders.appendRow(safeRow_([order.id, new Date(), order.name, order.phone, order.email, order.ig || "-", orderTotal_(order), file.getUrl(), "Waiting", "New", "", ""], WHATSAPP_INDEX));
      }
      const rows = itemRows_(order);
      if (!inItems && rows.length > 0) {items.getRange(items.getLastRow() + 1, 1, rows.length, ITEM_HEADERS.length).setValues(rows);}
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
  if (Array.isArray(o.lines) && (Number(o.discount) || 0) !== expectedDiscount_(o.lines)) {return "Bad discount.";}
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
    for (const key of LINE_TEXT_KEYS) {
      if (line[key] !== undefined && String(line[key]).length > 100) {return "An item description is too long.";}
    }
    if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > MAX_LINE_QTY) {return "Bad item quantity.";}
    if (typeof line.unitPrice !== "number" || line.unitPrice !== expectedPrice_(line)) {return "Bad item price.";}
  }
  return "";
}

// The real price of one line, or -1 when the product or its case choices are unknown.
function expectedPrice_(line) {
  if (line.product === "Phone Case") {
    if (line.caseType === "Standard") {return STANDARD_CASE_PRICE;}
    const material = line.caseType === "Premium" ? PREMIUM_MATERIALS[line.material] : undefined;
    if (!material) {return -1;}
    return line.magsafe === "MagSafe" && material.magsafePrice ? material.magsafePrice : material.price;
  }
  return FIXED_PRICES[line.product] === undefined ? -1 : FIXED_PRICES[line.product];
}

// Savings from the sticker bundle (5 for 25,000) across all sticker lines of the order.
function expectedDiscount_(lines) {
  const count = lines.filter(l => l.product === "Sticker").reduce((sum, l) => sum + l.qty, 0);
  const bundles = Math.floor(count / STICKER_BUNDLE_SIZE);
  return bundles * (STICKER_BUNDLE_SIZE * FIXED_PRICES["Sticker"] - STICKER_BUNDLE_PRICE);
}

// Calculates numeric total from lines and discount, or falls back to digits in o.total for cached clients without lines.
function orderTotal_(o) {
  const discount = Number(o.discount) || 0;
  if (Array.isArray(o.lines) && o.lines.length > 0) {
    const subtotal = o.lines.reduce((sum, l) => sum + (l.qty * l.unitPrice), 0);
    return subtotal - discount;
  }
  return Number(String(o.total || "").replace(/\D/g, "")) || 0;
}

function magsafeValue_(val) {
  if (val === "MagSafe") {return "Yes";}
  if (val === "No MagSafe") {return "No";}
  return "";
}

// One row per item, plus an optional discount row. Inapplicable attributes are left empty.
function itemRows_(o) {
  const rows = (o.lines || []).map((l, i) => safeRow_([
    o.id,
    i + 1,
    l.product,
    l.design,
    l.series || "",
    l.caseType || "",
    l.material || "",
    magsafeValue_(l.magsafe),
    l.phoneType || "",
    l.model || "",
    l.frame || "",
    l.qty,
    l.unitPrice,
    l.qty * l.unitPrice
  ]));

  const discount = Number(o.discount) || 0;
  if (discount > 0 && rows.length > 0) {
    rows.push(safeRow_([
      o.id,
      rows.length + 1,
      "Discount",
      "Bundle discount",
      "", "", "", "", "", "", "",
      1,
      -discount,
      -discount
    ]));
  }
  return rows;
}

// A cell starting with = + - @ would be run as a formula by Sheets. A leading apostrophe turns it into plain text.
function safe_(value) {
  return typeof value === "string" && /^[=+\-@]/.test(value) ? "'" + value : value;
}

// Escapes every cell except the one at plainIndex (WhatsApp on the Orders tab), which is a plain-text column where a leading apostrophe would show up literally.
function safeRow_(row, plainIndex) {
  return row.map((value, i) => i === plainIndex ? value : safe_(value));
}

function extension_(mime) {
  return mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Finds or creates the tab, and updates headers + formatting only when the header row changes.
function getSheet_(name, headers) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(name) || book.insertSheet(name);
  const range = sheet.getRange(1, 1, 1, headers.length);
  if (range.getValues()[0].join("|") !== headers.join("|")) {
    range.setValues([headers]);
    if (name === ORDERS_SHEET) {formatOrdersSheet_(sheet);}
    if (name === ITEMS_SHEET) {formatItemsSheet_(sheet);}
  }
  return sheet;
}

// Applies shared header and body formatting (wrap, alignment, column widths).
function formatSheet_(sheet, headers, widths) {
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBackground("#EFEFEF");

  const bodyRows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, 1, bodyRows, headers.length)
    .setWrap(true)
    .setHorizontalAlignment("left")
    .setVerticalAlignment("top");

  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
}

// Formats Orders tab: plain text WhatsApp column and status dropdown validations.
function formatOrdersSheet_(sheet) {
  formatSheet_(sheet, ORDER_HEADERS, ORDER_WIDTHS);
  const bodyRows = Math.max(sheet.getMaxRows() - 1, 1);

  // Column 4 (D) is WhatsApp: format as plain text to keep leading zeros.
  sheet.getRange(2, 4, bodyRows, 1).setNumberFormat("@");

  // Column 9 (I) is Payment status, Column 10 (J) is Order status.
  const paymentRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(PAYMENT_STATUSES, true)
    .setAllowInvalid(false)
    .build();
  const orderRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ORDER_STATUSES, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(2, 9, bodyRows, 1).setDataValidation(paymentRule);
  sheet.getRange(2, 10, bodyRows, 1).setDataValidation(orderRule);
}

// Formats Items tab and applies pastel row conditional formatting per product.
function formatItemsSheet_(sheet) {
  formatSheet_(sheet, ITEM_HEADERS, ITEM_WIDTHS);
  addProductColours_(sheet);
}

// Replaces conditional formatting rules on Items tab so re-running setup() never duplicates rules.
function addProductColours_(sheet) {
  const range = sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), ITEM_HEADERS.length);
  const rules = Object.entries(PRODUCT_COLOURS).map(([product, hex]) =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=$C2="${product}"`)
      .setBackground(hex)
      .setRanges([range])
      .build()
  );
  sheet.setConditionalFormatRules(rules);
}

// Creates and formats the Summary tab with per-design QUERY (A:C) and per-product SUMIFS (E:F).
function setupSummary_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(SUMMARY_SHEET) || book.insertSheet(SUMMARY_SHEET);
  sheet.clear();
  sheet.setFrozenRows(1);

  // Per-design table in A1:C
  sheet.getRange("A1").setFormula(
    `=QUERY(${ITEMS_SHEET}!A:N, "select C, D, sum(L) where C is not null and C <> 'Discount' group by C, D label sum(L) 'Qty ordered'", 1)`
  );

  // Per-product totals table in E1:F6
  sheet.getRange("E1:F1").setValues([["Product", "Qty ordered"]]);
  const productRows = SUMMARY_PRODUCTS.map((prod, idx) => {
    const rowNum = idx + 2;
    return [prod, `=SUMIFS(${ITEMS_SHEET}!L:L, ${ITEMS_SHEET}!C:C, E${rowNum})`];
  });
  sheet.getRange(2, 5, productRows.length, 2).setValues(productRows);

  // Header styles for both tables
  sheet.getRange("A1:C1")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBackground("#EFEFEF");
  sheet.getRange("E1:F1")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBackground("#EFEFEF");

  // Body styles
  const bodyRows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, 1, bodyRows, 6)
    .setWrap(true)
    .setHorizontalAlignment("left")
    .setVerticalAlignment("top");

  SUMMARY_WIDTHS.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
}

function getFolder_() {
  const found = DriveApp.getFoldersByName(FOLDER_NAME);
  return found.hasNext() ? found.next() : DriveApp.createFolder(FOLDER_NAME);
}