// Entry point: connects page events to the functions that handle them, then draws the page.
import {selection} from "./state.js";
import {addToOrder, choose, renderCategories, renderOptions, selectCategory, setModel, stepPicked, stepQty, updateAddButton} from "./picker.js";
import {removeFromCart, renderCart, stepCartQty} from "./cart.js";
import {loadCustomer, saveCustomer} from "./customer.js";
import {editOrder, showReview} from "./checkout.js";

const STEPS = {qty: (index, delta) => stepQty(delta), pick: stepPicked, cart: stepCartQty};

document.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) {return;}
  const data = button.dataset;
  if (data.category) {selectCategory(data.category);}
  else if (data.choose) {choose(data.choose, data.value);}
  else if (data.design) {choose("designIndex", Number(data.design));}
  else if (data.step) {STEPS[data.step](Number(data.index), Number(data.delta));}
  else if (data.remove) {removeFromCart(Number(data.remove));}
  else if (button.id === "add") {addToOrder();}
  else if (button.id === "review-order") {showReview();}
  else if (button.id === "edit-order") {editOrder();}
});

document.addEventListener("change", event => {
  const {id, value} = event.target;
  if (id === "model") {setModel(value);}
  if (id === "frame") {selection.frame = value;}
  updateAddButton();
});

document.addEventListener("input", event => {
  const {id, value} = event.target;
  if (id === "design") {selection.caseDesign = value;}
  if (id === "other") {selection.otherModel = value;}
  event.target.closest(".f")?.classList.remove("bad");
  saveCustomer();
  updateAddButton();
});

loadCustomer();
renderCategories();
renderOptions();
renderCart();
