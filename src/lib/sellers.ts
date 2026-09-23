// Who actually sells a product. Stored on each Shopify product as a
// "supplier:<slug>" tag, so a product with no such tag has no seller shown
// rather than being attributed to the wrong one.
//
// Brand and seller are different things: a CWD saddle is made by CWD and sold
// by one of these. Brand lives in Shopify's vendor field.
export type Seller = { slug: string; name: string };

const SELLER_NAMES: Record<string, string> = {
  "the-tack-shop": "The Tack Shop",
  "delhi-tack-shop": "Delhi Tack Shop",
};

export const SUPPLIER_TAG_PREFIX = "supplier:";

/** The code the supplier knows this product by, carried on the product as
 *  "supplier-code:<code>". Delhi Tack Shop's importer writes it; The Tack Shop
 *  is matched on SKU instead, so its products have none. */
export function supplierCodeFromTags(tags: string[]): string | null {
  const tag = tags.find((t) => t.startsWith("supplier-code:"));
  return tag ? tag.slice("supplier-code:".length) : null;
}

export function sellerFromTags(tags: string[]): Seller | null {
  const tag = tags.find((t) => t.startsWith(SUPPLIER_TAG_PREFIX));
  if (!tag) return null;
  const slug = tag.slice(SUPPLIER_TAG_PREFIX.length);
  const name = SELLER_NAMES[slug];
  // An unknown slug means a seller was added to the catalogue before it was
  // named here -- show nothing rather than a raw slug.
  return name ? { slug, name } : null;
}
