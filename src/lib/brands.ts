// Brand names come from Shopify's vendor field, which is free text, so the URL
// slug is derived rather than stored. Lives apart from data/products.ts so that
// components can build a brand link without pulling in the server-only Shopify
// client.
export function brandSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Shopify has no empty vendor, so a product with no maker still carries one.
// The migration wrote "Indusequine" for those, and one supplier's feed used the
// literal "Non Branded". Both mean the same thing: there is no brand to show,
// and neither belongs in a brand list.
const NO_BRAND = new Set(["Indusequine", "Non Branded"]);

export function brandFromVendor(vendor: string | null | undefined): string | null {
  const name = vendor?.trim();
  return !name || NO_BRAND.has(name) ? null : name;
}
