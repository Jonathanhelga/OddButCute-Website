// Step 1: choosing a category, its design and options, then adding it to the order.
import {CATALOG_URL, CATEGORIES, DESIGNS, FRAME_COLOURS, IPHONE_MODELS, MATERIALS, MAX_QTY, MAX_QTY_AFTER_MERGE, OTHER_IPHONE, PREMIUM_FIRST_MODEL, STANDARD_CASE_PRICE} from "./config.js";
import {cart, selection} from "./state.js";
import {bundleCost, caseFromPrice, casePrice, findMaterial, premiumFromPrice, qtyInCart} from "./pricing.js";
import {stepper, thumbnail} from "./components.js";
import {renderCart} from "./cart.js";
import {$, clamp, escapeHtml, formatIdr, toast} from "./utils.js";

const REQUIRED = `<i class="req">*</i>`;
const on = active => active ? " on" : "";
const designImage = (category, design) => `assets/designs/${category}/${design.img}`;
const designThumbnail = (category, design) => thumbnail(designImage(category, design), CATEGORIES[category].imageFit);
const isOtherModel = () => selection.os === "Android" || selection.model === OTHER_IPHONE;
const pickedFor = category => selection.pickedQty[category] ||= {};
const pickedCount = () => Object.values(pickedFor(selection.category)).reduce((sum, n) => sum + n, 0);

// ---------- rendering ----------

export function renderCategories() {
  $("#categories").innerHTML = Object.entries(CATEGORIES).map(([key, c]) => {
    const price = key === "case" ? "from " + formatIdr(caseFromPrice()) : formatIdr(c.price);
    const tag = c.tag ? `<small class="tag">${c.tag}</small>` : "";
    return `<button class="chip${on(selection.category === key)}" data-category="${key}"><img class="pic" src="assets/products/${key}.jpg" alt="">${c.name}<small>${price}</small>${tag}</button>`;
  }).join("");
}

export function renderOptions() {
  const category = CATEGORIES[selection.category];
  if (category.pickMany) {renderPickMany(); return;}
  let html = selection.category === "case" ? caseOptionsHtml() : designTilesHtml();
  html += `<div class="row qty-row">${stepper("qty", selection.qty)}<button class="btn" id="add">Add to order</button></div>`;
  $("#options").innerHTML = html;
  updateAddButton();
}

function designTilesHtml() {
  const designs = DESIGNS[selection.category];
  if (selection.designIndex >= designs.length) {selection.designIndex = 0;}
  const tiles = designs.map((d, i) => `<button class="tile${on(selection.designIndex === i)}" data-design="${i}">${designThumbnail(selection.category, d)}${escapeHtml(d.name)}</button>`).join("");
  return `<span class="lbl">Design</span><div class="grid">${tiles}</div>`;
}

// A row of chips where the customer picks one value for selection[field].
function choiceGroup(id, label, field, choices) {
  const chips = choices.map(c => `<button class="chip${on(selection[field] === c.value)}" data-choose="${field}" data-value="${c.value}"${c.disabled ? " disabled" : ""}>${c.html}</button>`).join("");
  return `<span class="lbl" id="${id}">${label} ${REQUIRED}</span><div class="chips cols-2">${chips}</div>`;
}

const selectHtml = (id, placeholder, options, current) => `<select id="${id}"><option value="" disabled${current ? "" : " selected"}>${placeholder}</option>${options.map(o => `<option${o === current ? " selected" : ""}>${o}</option>`).join("")}</select>`;

const otherModelField = (placeholder, extraClass, visible) => `<div class="f${extraClass}" id="f-other"${visible ? "" : " hidden"}><input id="other" placeholder="${placeholder}" value="${escapeHtml(selection.otherModel)}"><small class="e">Please type your phone model.</small></div>`;

function caseOptionsHtml() {
  const s = selection, premium = s.tier === "Premium";
  if (s.os === "Android" && findMaterial(s.material)?.iphoneOnly) {s.material = "";}
  const models = premium ? IPHONE_MODELS.slice(IPHONE_MODELS.indexOf(PREMIUM_FIRST_MODEL)) : IPHONE_MODELS;
  if (!models.includes(s.model)) {s.model = "";}

  let html = `<div class="f" id="f-design"><label>Design ${REQUIRED}</label><input id="design" placeholder="Type the design name or code from our catalog" value="${escapeHtml(s.caseDesign)}"><small class="e">Please type the design you want.</small></div>`;
  html += `<a class="btn alt catalog-link" href="${CATALOG_URL}" target="_blank" rel="noopener">🌸 See our catalog</a>`;
  const tiers = [{value: "Standard", picClass: "pic-standard", img: "case-standard", price: formatIdr(STANDARD_CASE_PRICE)}, {value: "Premium", picClass: "", img: "case-premium", price: "from " + formatIdr(premiumFromPrice())}];
  html += choiceGroup("pick-tier", "Case type", "tier", tiers.map(t => ({value: t.value, html: `<img class="pic tier-pic ${t.picClass}" src="assets/products/${t.img}.jpg" alt="">${t.value} case<small>${t.price}</small>`})));
  if (!s.tier) {return html;}

  if (premium) {
    html += choiceGroup("pick-material", "Material", "material", MATERIALS.map(m => ({value: m.name, html: m.name + (m.note ? `<small>${m.note}</small>` : ""), disabled: m.iphoneOnly && s.os === "Android"})));
    const material = findMaterial(s.material);
    if (material?.magsafePrice) {html += choiceGroup("pick-magsafe", "MagSafe", "magsafe", [{value: "MagSafe", html: `MagSafe<small>${formatIdr(material.magsafePrice)}</small>`}, {value: "No MagSafe", html: `No MagSafe<small>${formatIdr(material.price)}</small>`}]);}
  }
  html += choiceGroup("pick-os", "Phone type", "os", ["iPhone", "Android"].map(os => ({value: os, html: os})));
  if (!s.os) {return html;}

  let model;
  if (s.os === "iPhone") {
    model = `<span class="lbl">iPhone model ${REQUIRED}</span>` + selectHtml("model", "Select phone model", models, s.model);
    if (premium) {model += `<p class="note">Premium is available for ${PREMIUM_FIRST_MODEL} and newer.</p>`;}
  }
  else {
    model = `<span class="lbl">Phone model ${REQUIRED}</span>` + otherModelField("e.g. Samsung Galaxy S23", " flush", true);
  }
  const frame = premium ? `<div><span class="lbl">Frame colour ${REQUIRED}</span>${selectHtml("frame", "Select frame colour", FRAME_COLOURS, s.frame)}</div>` : "";
  html += `<div class="${premium ? "two" : ""}"><div>${model}</div>${frame}</div>`;
  if (s.os === "iPhone") {html += otherModelField("Type your iPhone model", "", s.model === OTHER_IPHONE);}
  if (!premium) {html += `<p class="note">Standard case comes in a black frame.</p>`;}
  return html;
}

// Categories with pickMany: a quantity stepper on every design, grouped by series.
function renderPickMany() {
  const key = selection.category, c = CATEGORIES[key], designs = DESIGNS[key], picked = pickedFor(key);
  const series = new Map();
  designs.forEach((d, i) => {
    const name = d.series || "Designs";
    if (!series.has(name)) {series.set(name, []);}
    series.get(name).push(i);
  });
  const priceNote = `· ${formatIdr(c.price)} each` + (c.bundle ? ` · ${c.bundle.size} for ${formatIdr(c.bundle.price)}` : "");
  let html = `<p class="note intro">${c.min > 1 ? `${escapeHtml(c.name)}s: minimum buy ${c.min}. ` : ""}Choose your designs and quantities.</p>`;
  for (const [name, indexes] of series) {
    const tiles = indexes.map(i => `<div class="tile static${on(picked[i] > 0)}">${designThumbnail(key, designs[i])}${escapeHtml(designs[i].name)}${stepper("pick", picked[i] || 0, i, true)}</div>`).join("");
    html += `<span class="lbl">${escapeHtml(name)} <span class="muted">${priceNote}</span></span><div class="grid">${tiles}</div>`;
  }
  html += `<p class="note intro" id="pick-summary"></p><div class="add-row"><button class="btn big" id="add">Add to order</button></div>`;
  $("#options").innerHTML = html;
  updateAddButton();
}

// Shows the price on the "Add to order" button and, for pickMany categories, how many designs are selected.
export function updateAddButton() {
  const button = $("#add");
  if (!button) {return;}
  const key = selection.category, c = CATEGORIES[key];
  if (c.pickMany) {
    const n = pickedCount(), inCart = c.bundle ? qtyInCart(key) : 0;
    const cost = c.bundle ? bundleCost(key, inCart + n) - bundleCost(key, inCart) : n * c.price;
    button.textContent = "Add to order" + (n ? ` · ${n} · ${formatIdr(cost)}` : "");
    const summary = $("#pick-summary");
    summary.textContent = c.min > 1 ? `Selected: ${n} (minimum ${c.min})` : `Selected: ${n}`;
    summary.classList.toggle("error", n > 0 && n < c.min);
    return;
  }
  const price = key === "case" ? casePrice() : c.price;
  button.textContent = "Add to order" + (key === "case" && missingCaseChoice() ? "" : " · " + formatIdr(price * selection.qty));
}

// ---------- changing the selection ----------

export function selectCategory(key) {
  selection.category = key;
  selection.designIndex = 0;
  selection.qty = 1;
  renderCategories();
  renderOptions();
}

export function choose(field, value) {
  selection[field] = value;
  renderOptions();
}

export function setModel(value) {
  selection.model = value;
  $("#f-other").hidden = value !== OTHER_IPHONE;
}

export function stepQty(delta) {
  selection.qty = clamp(selection.qty + delta, 1, MAX_QTY);
  renderOptions();
}

export function stepPicked(index, delta) {
  const picked = pickedFor(selection.category);
  picked[index] = clamp((picked[index] || 0) + delta, 0, MAX_QTY);
  if (!picked[index]) {delete picked[index];}
  renderOptions();
}

// ---------- adding to the order ----------

// The first phone case choice the customer has not made yet, or null when everything is chosen.
function missingCaseChoice() {
  const s = selection, premium = s.tier === "Premium";
  if (!s.caseDesign.trim()) {return {id: "f-design", message: "Please type the design you want"};}
  if (!s.tier) {return {id: "pick-tier", message: "Please choose Standard or Premium case"};}
  if (premium && !s.material) {return {id: "pick-material", message: "Please choose a material"};}
  if (premium && findMaterial(s.material).magsafePrice && !s.magsafe) {return {id: "pick-magsafe", message: "Please choose MagSafe or No MagSafe"};}
  if (!s.os) {return {id: "pick-os", message: "Please choose iPhone or Android"};}
  if (s.os === "iPhone" && !s.model) {return {id: "model", message: "Please select your phone model"};}
  if (isOtherModel() && !s.otherModel.trim()) {return {id: "other", message: "Please type your phone model"};}
  if (premium && !s.frame) {return {id: "frame", message: "Please choose a frame colour"};}
  return null;
}

function showMissing({id, message}) {
  toast(message);
  const el = $("#" + id);
  if (!el) {return;}
  el.scrollIntoView({block: "center"});
  el.closest(".f")?.classList.add("bad");
}

// e.g. "Premium · Glossy Glass · MagSafe · iPhone 15 Pro · Silver frame"
function caseDetail() {
  const s = selection, premium = s.tier === "Premium", parts = [s.tier];
  if (premium) {parts.push(s.material);}
  if (premium && findMaterial(s.material).magsafePrice) {parts.push(s.magsafe);}
  parts.push((s.os === "Android" ? "Android " : "") + (isOtherModel() ? s.otherModel.trim() : s.model));
  parts.push((premium ? s.frame : "Black") + " frame");
  return parts.join(" · ");
}

// Adds a line to the cart, or raises the quantity of the same line if it is already there.
function addLine(line, maxQty) {
  const key = `${line.category}|${line.name}|${line.detail}`;
  const existing = cart.find(item => item.key === key);
  if (existing) {existing.qty = Math.min(maxQty, existing.qty + line.qty);}
  else {cart.push({...line, key});}
}

function afterAdd() {
  renderOptions();
  renderCart();
  toast("Added to your order ♡");
}

export function addToOrder() {
  const key = selection.category, c = CATEGORIES[key];
  if (c.pickMany) {addPicked(); return;}
  if (key === "case") {
    const missing = missingCaseChoice();
    if (missing) {showMissing(missing); return;}
    addLine({category: key, name: c.name + " – " + selection.caseDesign.trim(), detail: caseDetail(), img: "assets/products/case.jpg", price: casePrice(), qty: selection.qty}, MAX_QTY);
  }
  else {
    const design = DESIGNS[key][selection.designIndex];
    addLine({category: key, name: c.name + " – " + design.name, detail: "", img: designImage(key, design), imageFit: c.imageFit, price: c.price, qty: selection.qty}, MAX_QTY);
  }
  selection.qty = 1;
  afterAdd();
}

function addPicked() {
  const key = selection.category, c = CATEGORIES[key], n = pickedCount();
  if (!n) {toast("Please choose at least one design"); return;}
  const inCart = qtyInCart(key);
  if (inCart + n < c.min) {toast(`${c.name}s: minimum buy ${c.min}. Add ${c.min - inCart - n} more.`); return;}
  for (const [i, qty] of Object.entries(pickedFor(key))) {
    const design = DESIGNS[key][i];
    addLine({category: key, name: c.name + " – " + design.name, detail: "", img: designImage(key, design), imageFit: c.imageFit, price: c.price, qty}, MAX_QTY_AFTER_MERGE);
  }
  selection.pickedQty[key] = {};
  afterAdd();
}
