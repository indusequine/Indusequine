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
