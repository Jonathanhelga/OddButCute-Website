# Order sheet: current state, end goal and plan

Status: written down only. Nothing here is implemented yet.
Nothing in `apps-script/Code.gs` or `js/` has been changed for this document.

## Words used in this document

- **Line**: one entry in the cart. One product, one set of choices, one quantity.
- **Attribute**: one choice attached to a product, for example the material of a phone case.
- **Tab**: one page inside the Google Sheet file. Today there are two, `Orders` and `Items`.
- **Conditional formatting**: a Sheets rule that colours a cell or row automatically when a condition is true.
- **Formula**: a cell that calculates its value from other cells, for example `=SUMIFS(...)`.
- **`SUMIFS`**: adds up one column, only for the rows where another column matches a value.
- **`QUERY`**: a Sheets formula that filters and groups rows with a short SQL-like sentence.
- **Pivot table**: a Sheets feature that groups rows and sums a column, for example total sold per product.
- **base64**: a way to write an image file as plain text characters, so it can be sent inside the order.
- **Wrap**: a cell setting that makes long text continue on a new line inside the cell, instead of running over the cells to its right.

## End goal

1. Every order is saved in a layout that filters and sums cleanly: one value per cell, numbers stored as numbers.
2. Every body cell wraps its text and is left-aligned. Only the header row is centred.
3. Every product has its own pastel row colour in the `Items` tab, so products are visually separated.
4. A `Summary` tab shows how many of each product and design were ordered, without reading rows one by one.
5. The shop owner has columns to track each order by hand: payment status, order status, tracking number, notes.

## 1. Every attribute combination

Only Phone Case has attributes beyond design and quantity.

| Product | Design | Other attributes | Unit price (IDR) |
|---|---|---|---|
| Puffy Pouch | 1 of 3 | none | 59,000 |
| Polka Bag | 1 of 2 | none | 169,900 |
| Sticker | 1 of 13 | none | 6,000, every 5 stickers cost 25,000 |
| Phone Strap | 1 of 18 (12 Stripes Series, 6 Polka Series) | none | 29,000 |
| Phone Case | typed by the customer | see the table below | see the table below |

Phone Case has 28 valid combinations, before counting phone model and design:

| caseType | material | magsafe | phoneType | frame | unitPrice |
|---|---|---|---|---|---|
| Standard | empty | empty | iPhone, Android | always Black | 85,000 |
| Premium | Epoxy | empty (not offered) | iPhone only | Black, Silver | 139,900 |
| Premium | Glossy Glass | MagSafe / No MagSafe | iPhone, Android | Black, Silver | 149,900 / 139,900 |
| Premium | Doff | MagSafe / No MagSafe | iPhone, Android | Black, Silver | 149,900 / 139,900 |
| Premium | Leather | MagSafe / No MagSafe | iPhone, Android | Black, Silver | 159,900 / 149,900 |

The phone `model` depends on the rows above:

```
Standard + iPhone -> 1 of 35 listed models, or typed text ("Other iPhone")
Premium  + iPhone -> 1 of 28 listed models (iPhone 11 and newer), or typed text
any      + Android -> always typed text, e.g. "Samsung Galaxy S23"
```

Quantity is 1 to 20 per line.
Sticker and strap lines can reach 50 when the same design is added twice.

## 2. Shape of the submitted order

This is what `submitOrder()` in `js/checkout.js` sends to the Apps Script web app:

```js
{
  id: "OBC-261118-K3ZQ",
  name: "Aulia Putri",
  phone: "0812 3456 7890",
  email: "aulia@email.com",
  ig: "@aulia",                 // "-" when left empty
  items: "1. Phone Case – Bunny 12 (Premium · Glossy Glass · MagSafe · iPhone 15 Pro · Silver frame) x1 = IDR 149,900\n2. Sticker – Korban HTS x5 = IDR 30,000\nSticker bundle discount: -IDR 5,000",
  total: "IDR 174,900",         // text, not a number
  discount: 5000,               // number
  lines: [
    {product: "Phone Case", design: "Bunny 12", caseType: "Premium", material: "Glossy Glass", magsafe: "MagSafe", phoneType: "iPhone", model: "iPhone 15 Pro", frame: "Silver", qty: 1, unitPrice: 149900},
    {product: "Sticker", design: "Korban HTS", qty: 5, unitPrice: 6000},   // no attribute keys at all
  ],
  screenshot: {mime: "image/jpeg", data: "<base64 text>"},
  website: "",                  // hidden spam trap, always "" for a real customer
}
```

## 3. Current sheet layout (what exists today)

```
Orders: Received at | Order ID | Name | WhatsApp | Email | Instagram | Items | Total | Payment screenshot | Bundle discount (IDR)
Items:  Order ID | Item # | Product | Design | Case type | Material | MagSafe | Phone type | Model | Frame colour | Qty | Unit price (IDR) | Line total (IDR)
```

Problems:

- `Total` is saved as the text `"IDR 174,900"`, so `SUM` cannot add it up.
- The `Items` text column in `Orders` repeats what the `Items` tab already holds.
- The bundle discount is only a column in `Orders`, so the `Items` line totals of an order do not add up to what the customer paid.
- Long text overflows to the right, numbers are right-aligned.
- Rows of different products are mixed together.
- No columns for the owner to track payment and shipping.

## 4. End-goal sheet layout

Two tabs stay, one row per order and one row per line, because filters and pivot tables need one value per cell.
The empty case columns on sticker rows are normal and harmless.

```
Orders: Order ID | Received at | Name | WhatsApp | Email | Instagram | Total | Screenshot | Payment status | Order status | Tracking no | Notes
        OBC-...  | 18/11/2026  | Aulia| 0812...  | ...   | @aulia    | 174900| drive link | Waiting        | New          |             |

Items:  Order ID | Line # | Product    | Design     | Series | Case type | Material     | MagSafe | Phone type | Phone model   | Frame  | Qty | Unit price | Line total
        OBC-...  | 1      | Phone Case | Bunny 12   |        | Premium   | Glossy Glass | Yes     | iPhone     | iPhone 15 Pro | Silver | 1   | 149900     | 149900
        OBC-...  | 2      | Sticker    | Korban HTS |        |           |              |         |            |               |        | 5   | 6000       | 30000
        OBC-...  | 3      | Sticker    | Bundle discount |   |           |              |         |            |               |        | 1   | -5000      | -5000
```

Design decisions:

1. `Total` is stored as a number.
2. The `Items` text column is removed from `Orders`.
3. The bundle discount becomes its own row in `Items`, so the line totals of an order sum to exactly what was paid, and a pivot table per product shows real sticker revenue.
4. `Payment status` and `Order status` are dropdown columns the owner fills by hand. `Tracking no` and `Notes` are free text.
5. `Series` is a new column, filled for straps (Stripes Series, Polka Series). The site already knows it but does not send it today.
6. The `WhatsApp` column is formatted as plain text, so a number like `081234567890` keeps its leading 0.
7. No separate Customers tab. Customers have no account, so the same person can type their name differently each time. A pivot table on `WhatsApp` already shows repeat buyers.

## 5. Formatting plan

### Wrap and alignment

- Header row: bold, centred, light grey background.
- Body cells: wrap on, left-aligned, top-aligned.
- Each column gets a fixed width, because wrap only works when the column has a width limit. Wide for long text and `Design`, narrow for `Qty`.
- The format is applied to the whole column range, so rows added later inherit it.

### Pastel colour per product (conditional formatting on the `Items` tab)

| Product | Colour | Hex |
|---|---|---|
| Phone Case | lavender | `#E6E0F8` |
| Puffy Pouch | pink | `#FADADD` |
| Polka Bag | peach | `#FFE5D0` |
| Sticker | yellow | `#FFF7C2` |
| Phone Strap | mint | `#D8F3E3` |

One rule per product, applied to the whole row, checking the `Product` column:

```
Range: Items!A2:N
Rule:  =$C2="Sticker"  -> #FFF7C2
```

A rule for the `Bundle discount` row (Product = Sticker) is coloured as a sticker row, which keeps the discount visually attached to its product.

## 6. Summary tab

Color helps the eyes but does not add anything up, so a third tab does the counting.
The column letters below match the end-goal layout (Product = C, Design = D, Qty = L).
If the formatting is done first on the current layout, Qty is column K instead.

```
Summary!A1:
=QUERY(Items!A:N, "select C, D, sum(L) where C is not null group by C, D label sum(L) 'Qty ordered'", 1)

Per product total block:
A2: Sticker    B2: =SUMIFS(Items!L:L, Items!C:C, A2)
```

Example result, updating by itself every time an order arrives:

```
Product      | Design            | Qty ordered
Phone Case   | Bunny 12          | 2
Sticker      | Korban HTS        | 11
Sticker      | Deadline Is My... | 7
Phone Strap  | Polka Mint        | 4
```

The `Bundle discount` rows have Qty 1 and must be left out of the quantity count, so the `QUERY` needs `and D <> 'Bundle discount'` in its `where` part, or the discount rows need Qty 0.
This is an open detail to decide when implementing.

## 7. Implementation plan (not started)

All changes are in `apps-script/Code.gs`.
Nothing in `js/` changes, except the `series` field that must be added to each line in `orderLines()` in `js/checkout.js` if the `Series` column is wanted.

1. Update `ORDER_HEADERS` and `ITEM_HEADERS` to the end-goal layout, and update `doPost`, `itemRows_` and `validate_` to match (numeric total, discount as an Items row).
2. Add constants: `PRODUCT_COLOURS`, `SUMMARY_SHEET`, and the column widths per header.
3. Add `formatSheet_(sheet, headers)`: header style, body wrap and left-align, widths, plain-text `WhatsApp` column. Call it from `getSheet_` only when the header row had to be rewritten, so `doPost` stays fast, and from `setup()`.
4. Add `addProductColours_(sheet)`: one conditional format rule per product, replacing the sheet's rules each time, so running `setup()` twice does not create duplicates.
5. Add `setupSummary_()`: creates the `Summary` tab with the `QUERY` and `SUMIFS` formulas.
6. Add dropdown validation to `Payment status` and `Order status`.
7. `setup()` calls all of the above.

### Rolling it out on the live sheet

1. Paste the new `Code.gs` into the Apps Script editor of the sheet.
2. Run `setup()` once from the editor.
3. Deploy > Manage deployments > edit > New version.
4. The web app URL in `js/settings.js` stays the same.

Existing rows keep the old column layout, so the old rows need to be moved or the old tabs renamed before the header rewrite, or the header rewrite will label old data with the wrong titles.
This must be decided before step 2.

## 8. Verification (for when it is implemented)

- Run `setup()`: the `Orders`, `Items` and `Summary` tabs exist, the header is centred, the body is left-aligned and wrapped.
- Run `setup()` a second time: Format > Conditional formatting shows 5 rules, not 10.
- Submit a test order from the site with one case, stickers and a strap: new rows are coloured per product, long text wraps, `WhatsApp` keeps its leading 0.
- `Summary` quantities equal the sum of the `Qty` column per product.
- The `Items` line totals of the test order sum to the `Total` in `Orders`.
- Delete the test rows afterwards.

## 9. Related problems found while reading the code (not part of this plan)

- The form collects no shipping address, so no sheet design can hold one.
- In `js/cart.js`, `stepCartQty` caps a line at `MAX_QTY` (20), but merging in `js/picker.js` allows `MAX_QTY_AFTER_MERGE` (50). A sticker line merged to 30 drops to 20 when the customer presses `+`.
