/**
 * Emails the right supplier when an enquiry comes in, and copies Indusequine.
 *
 * This runs in Google Apps Script, not in the site: enquiries already post to
 * the Apps Script webhook behind NEXT_PUBLIC_SHEETS_WEBHOOK_URL, which appends
 * them to the sheet. Sending the mail from there means no mail service, no
 * credentials in the repo, and it keeps working whoever is on the site.
 *
 * TO INSTALL
 *   1. Open the enquiries sheet, then Extensions > Apps Script.
 *   2. Paste this file in beside the existing doPost.
 *   3. Put the real addresses in SUPPLIERS below.
 *   4. In the existing doPost, after the row is appended, add:
 *         notifySupplier(payload);
 *   5. Save, then Run > notifySupplier once so Google asks for permission to
 *      send mail as you. It will not send until a real enquiry arrives.
 *
 * The site sends supplierSlug on every product enquiry, so nobody has to look
 * up who carries the product. An enquiry with no supplier (the contact form,
 * or a product predating the tags) goes to FALLBACK alone.
 */

var SUPPLIERS = {
  "the-tack-shop": { name: "The Tack Shop", email: "" },   // <- fill in
  "delhi-tack-shop": { name: "Delhi Tack Shop", email: "" }, // <- fill in
};

var FALLBACK = "hello@indusequine.com";

function notifySupplier(payload) {
  if (!payload || payload.form !== "product-enquiry") return;

  var supplier = SUPPLIERS[payload.supplierSlug];
  var to = supplier && supplier.email ? supplier.email : FALLBACK;
  var cc = supplier && supplier.email ? FALLBACK : "";

  var lines = [
    "A rider has asked about a product on indusequine.com.",
    "",
    "PRODUCT",
    "  " + payload.productName,
    payload.supplierCode ? "  Your code: " + payload.supplierCode : "",
    payload.sku ? "  SKU: " + payload.sku : "",
    "  https://indusequine.com/marketplace/product/" + payload.productId,
    "",
    "WHO IS ASKING",
    "  " + payload.name,
    "  " + payload.email,
    payload.phone ? "  " + payload.phone : "",
    "",
    payload.message ? "THEIR MESSAGE" : "",
    payload.message ? "  " + payload.message : "",
    "",
    "Reply to this email and it reaches them directly.",
  ];

  MailApp.sendEmail({
    to: to,
    cc: cc,
    replyTo: payload.email,
    subject: "Enquiry: " + payload.productName,
    body: lines.filter(function (line) { return line !== ""; }).join("\n"),
  });
}
