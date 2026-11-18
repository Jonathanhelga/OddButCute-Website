// What the customer is choosing right now in step 1, before tapping "Add to order".
export const selection = {
  category: "case",
  designIndex: 0,
  qty: 1,
  pickedQty: {}, // pickMany categories: {category: {designIndex: qty}}
  // phone case only
  caseDesign: "",
  tier: "",
  material: "",
  magsafe: "",
  os: "",
  model: "",
  otherModel: "",
  frame: "",
};

// Items already added. Each item: {category, key, name, detail, img, imageFit, price, qty}.
export const cart = [];
