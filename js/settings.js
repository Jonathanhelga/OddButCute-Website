// The only file a shop owner needs to edit. Change the values on the right of each colon, nothing else.
// Everything here is public: the browser downloads this file with the rest of the site, so never put passwords or API keys in it.
export const SETTINGS = {
  shopName: "odd but cute",
  instagram: "@odd.but.cute",

  // Starts every order ID, e.g. "OBC-261118-K3ZQ". 2 to 6 capital letters.
  orderPrefix: "OBC",

  // The Apps Script web app that receives orders (writes Sheet rows and saves the screenshot to Drive). Source: apps-script/Code.gs.
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbxYRTKgE8nnAMbOAizntk75l0Ix_R3dKS43_5-JhJncZQSOqk4xJjpzP2H6lIGPWteE/exec",

  // A Drive folder (shared as "Anyone with the link can view") that the "Catalog" button opens.
  catalogUrl: "https://drive.google.com/drive/folders/1oqHbyfZ8SgtWpc3bc_q9kBFKXDC4E2LQ",

  // The Google Form, used only as a fallback when the Apps Script submit fails. Each field value is the form question's entry ID.
  googleForm: {
    url: "https://docs.google.com/forms/d/e/1FAIpQLSeSIiyybds034qJPr1MgITzcZ2VnqPKm7ERgDRo4BkMiAstjQ/viewform",
    fields: {id: "1773519398", name: "2098529442", phone: "1888388137", email: "479180813", ig: "340134715", items: "592797559", total: "1500851931"},
  },
};
