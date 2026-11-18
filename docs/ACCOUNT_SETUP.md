# Moving the shop to another Google account

The website is not tied to a Google account.
The only thing that connects it to one is the `/exec` URL of the Apps Script web app.
Whoever owns that Apps Script owns the Sheet and the Drive folder that receive the orders.

Everything that changes per shop is in one file: `js/settings.js`.
You edit the values on the right of each colon and nothing else.

## How the pieces connect

```
Website (GitHub Pages)  --POST-->  appsScriptUrl (/exec)  -->  Sheet "Orders" + "Items"
                                                          -->  Drive folder (payment screenshots)
```

The Sheet is the one the script was created inside (Extensions > Apps Script).
The Drive folder is created by the script, inside the Drive of the account that deployed it.
Neither is written anywhere in the repo, so there is no Sheet ID or Folder ID to replace.

## 1. Create on the new account

1. Create a new Google Sheet.
2. In that Sheet, open Extensions > Apps Script.
3. Delete the sample code and paste all of `apps-script/Code.gs`, then save.
4. Pick `setup` in the function dropdown and click Run.
   Allow the Sheets and Drive permissions.
   This creates the `Orders` tab, the `Items` tab and the Drive folder.
5. Deploy > New deployment > type Web app.
   Execute as: Me.
   Who has access: Anyone.
6. Copy the URL that ends in `/exec`.
7. Open that URL in a browser.
   You should see `{"ok":true,"service":"OddButCute orders"}`.

## 2. Edit `js/settings.js`

| Field | Replace with |
|---|---|
| `shopName` | The new shop name. It appears in the browser tab title, the footer and the image descriptions. |
| `instagram` | The new Instagram handle, shown in the footer. |
| `orderPrefix` | 2 to 6 capital letters that start every order ID, for example `ABC` gives `ABC-261118-K3ZQ`. |
| `appsScriptUrl` | The new `/exec` URL. This is the only required change for orders to land in the new Sheet. |
| `catalogUrl` | A Drive folder link (shared as "Anyone with the link can view") with the new owner's catalog. |
| `googleForm.url` | The `viewform` link of the new owner's Google Form. See "Fallback Google Form" below. |
| `googleForm.fields` | The `entry.` ID of each question in that form. |

## 3. Replace these files

They are images, so they cannot live in `settings.js`.
Keep the same file names.

| File | Replace with |
|---|---|
| `assets/qris.png` | The new owner's QRIS code. Customers pay to this, so do not forget it. |
| `assets/logo.png` | The new owner's logo. |

Products, designs and prices are in `js/config.js` (`CATEGORIES`, `DESIGNS` and the other constants).
Their images are in `assets/products/` and `assets/designs/`.
Replace those if the new owner sells different items.

## 4. Optional: names inside `apps-script/Code.gs`

These live in Google, not in the website, so they cannot be moved into `settings.js`.
They only change names the new owner sees.
Nothing in the website depends on them.

| Variable | What it controls |
|---|---|
| `ORDERS_SHEET` | Name of the tab with one row per order. |
| `ITEMS_SHEET` | Name of the tab with one row per item. |
| `FOLDER_NAME` | Name of the Drive folder that stores payment screenshots. |
| `ORDER_HEADERS` and `ITEM_HEADERS` | The column titles. Changing them changes the header row on the next order. |

## Fallback Google Form (only used when the submit fails)

The form is used only if sending to the Apps Script fails.
The new owner must still replace `googleForm`, otherwise the fallback link opens the old account's form.
To set it up:

1. Create a Google Form with these questions, in this order: Order ID, Name, WhatsApp, Email, Instagram, Items, Total, and a file upload for the payment screenshot.
2. Click the three dots > Get pre-filled link.
3. Fill every question with a dummy value, such as `a`, then click Get link.
4. In the copied link, each question appears as `entry.<number>=a`.
   Put each number into the matching key of `googleForm.fields`.
5. Put the link up to `/viewform` into `googleForm.url`.

## 5. After changing the Apps Script code later

Saving the script is not enough.
Go to Deploy > Manage deployments > pencil icon > Version: New version > Deploy.
The `/exec` URL stays the same, so the website needs no change.

The script accepts any order prefix of 2 to 6 capital letters, so changing `orderPrefix` needs no script change.
If you were running an older version of `Code.gs` that only accepted `OBC-`, deploy the new version first.

## 6. Check that it works

1. Open the website and place one order with the name `TEST`.
2. Check that a row appears in `Orders` and the item rows appear in `Items`.
3. Check that the screenshot appears in the Drive folder.
4. Delete the test rows and the test file.

## What stays tied to the old account

- Old orders and screenshots stay in the old Sheet and Drive.
  Copy them over by hand if the new owner needs them.
- The old `/exec` URL keeps working until its owner deletes the deployment.
  Until `appsScriptUrl` is replaced and the site is republished, orders still go to the old Sheet.
