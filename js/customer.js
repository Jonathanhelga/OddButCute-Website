// Step 3: the customer's contact details.
import {$} from "./utils.js";

const FIELDS = ["name", "phone", "ig", "email"];
const STORAGE_KEY = "obc_info";

export const fieldValue = id => $("#" + id).value.trim();

// Remember the details on this device, so a returning customer does not type them again.
export function saveCustomer() {
  try {
    const saved = {};
    for (const id of FIELDS) {saved[id] = $("#" + id).value;}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }
  catch {}
}

export function loadCustomer() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) {return;}
    for (const id of FIELDS) {if (saved[id]) {$("#" + id).value = saved[id];}}
  }
  catch {}
}
