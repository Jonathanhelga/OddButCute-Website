// Products, designs and prices. Account details (links, shop name, order prefix) are in settings.js.

// pickMany: the customer picks a quantity per design, instead of one design at a time.
// bundle: buying `size` pieces costs `price` instead of `size` times the single price.
// imageFit: "contain" shows the whole design image, the default "cover" crops it to fill the box.
export const CATEGORIES = {
  case: {name: "Phone Case"},
  pouch: {name: "Puffy Pouch", price: 59000},
  bag: {name: "Polka Bag", price: 169900},
  sticker: {name: "Sticker", price: 6000, tag: "5 for IDR 25k", bundle: {size: 5, price: 25000}, pickMany: true, min: 1},
  strap: {name: "Phone Strap", price: 29000, pickMany: true, min: 1, imageFit: "contain"},
};

// Image files live in assets/designs/<category>/<img>.
export const DESIGNS = {
  pouch: [
    {name: "Sunny Stripe", img: "sunny-stripe.jpg"},
    {name: "Blue Stripe", img: "blue-stripe.jpg"},
    {name: "Pink Polka", img: "pink-polka.jpg"},
  ],
  bag: [
    {name: "Black Polka", img: "black-polka.jpg"},
    {name: "White Polka", img: "white-polka.jpg"},
  ],
  sticker: [
    {name: "Certified iPad Kid", img: "certified-ipad-kid.jpg"},
    {name: "Master's Degree in Yapping", img: "masters-degree-in-yapping.jpg"},
    {name: "Juara Satu Pura-Pura Produktif", img: "juara-satu-pura-pura-produktif.jpg"},
    {name: "Deadline Is My Cardio", img: "deadline-is-my-cardio.jpg"},
    {name: "Employed Diva", img: "employed-diva.jpg"},
    {name: "Sleep Is My Only Hobby", img: "sleep-is-my-only-hobby.jpg"},
    {name: "Korban HTS", img: "korban-hts.jpg"},
    {name: "Allergic to Bullshit", img: "allergic-to-bullshit.jpg"},
    {name: "9 to 5 Survivor", img: "9-to-5-survivor.jpg"},
    {name: "Bocil Kematian", img: "bocil-kematian.jpg"},
    {name: "No Thoughts Just Vibes", img: "no-thoughts-just-vibes.jpg"},
    {name: "Matcha First Problem Later", img: "matcha-first-problem-later.jpg"},
    {name: "Certified Matcha Girl", img: "certified-matcha-girl.jpg"},
  ],
  strap: [
    {name: "Mint Sugar", img: "mint-sugar.jpg", series: "Stripes Series"},
    {name: "Matcha", img: "matcha.jpg", series: "Stripes Series"},
    {name: "Bluey", img: "bluey.jpg", series: "Stripes Series"},
    {name: "Cotton Candy", img: "cotton-candy.jpg", series: "Stripes Series"},
    {name: "Lemon Pop", img: "lemon-pop.jpg", series: "Stripes Series"},
    {name: "Peach Swirl", img: "peach-swirl.jpg", series: "Stripes Series"},
    {name: "Pink Mellow", img: "pink-mellow.jpg", series: "Stripes Series"},
    {name: "Butter", img: "butter.jpg", series: "Stripes Series"},
    {name: "Rossie Sprinkle", img: "rossie-sprinkle.jpg", series: "Stripes Series"},
    {name: "Milk Candy", img: "milk-candy.jpg", series: "Stripes Series"},
    {name: "Berry Bubble", img: "berry-bubble.jpg", series: "Stripes Series"},
    {name: "Peach Tart", img: "peach-tart.jpg", series: "Stripes Series"},
    {name: "Polka White", img: "polka-white.jpg", series: "Polka Series"},
    {name: "Polka Mint", img: "polka-mint.jpg", series: "Polka Series"},
    {name: "Polka Green", img: "polka-green.jpg", series: "Polka Series"},
    {name: "Polka Baby Pink", img: "polka-baby-pink.jpg", series: "Polka Series"},
    {name: "Polka Pink", img: "polka-pink.jpg", series: "Polka Series"},
    {name: "Polka Yellow", img: "polka-yellow.jpg", series: "Polka Series"},
  ],
};

// Phone case options.
export const STANDARD_CASE_PRICE = 85000;
// price: Premium case price without MagSafe. magsafePrice: price with MagSafe. No magsafePrice means MagSafe is not offered.
export const MATERIALS = [
  {name: "Epoxy", note: "iPhone only", price: 139900, iphoneOnly: true},
  {name: "Glossy Glass", note: "", price: 139900, magsafePrice: 149900},
  {name: "Doff", note: "Matte", price: 139900, magsafePrice: 149900},
  {name: "Leather", note: "", price: 149900, magsafePrice: 159900},
];
export const FRAME_COLOURS = ["Black", "Silver"];
export const OTHER_IPHONE = "Other iPhone (type below)";
export const PREMIUM_FIRST_MODEL = "iPhone 11";
export const IPHONE_MODELS = ["iPhone 6 / 6s", "iPhone 6 Plus / 6s Plus", "iPhone 7 / 8 / SE (2020/2022)", "iPhone 7 Plus / 8 Plus", "iPhone X / XS", "iPhone XR", "iPhone XS Max", "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "iPhone 12 / 12 Pro", "iPhone 12 Pro Max", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max", "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max", "iPhone 16e", "iPhone 17", "iPhone 17e", "iPhone Air", "iPhone 17 Pro", "iPhone 17 Pro Max", "iPhone 18 Pro", "iPhone 18 Pro Max", OTHER_IPHONE];

// Quantity limits for one line in the order.
export const MAX_QTY = 20;
export const MAX_QTY_AFTER_MERGE = 50;
