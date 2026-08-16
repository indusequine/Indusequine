import catalogueRaw from "./catalogue.json";
import productImages from "./product-images.json";

export type Variant = {
  sku: string;
  size?: string | null;
  color?: string | null;
  price: number | null; // null = unknown / bad source data (≤ ₹5 in the source file)
};

export type Category = { slug: string; name: string };

export type ProductRaw = {
  slug: string;
  category: string;
  name: string;
  brand?: string | null;
  variants: Variant[];
};

export type Product = ProductRaw & { priceLabel: string; image?: string };

type CatalogueFile = {
  generatedAt: string;
  sourceFile: string;
  categories: Category[];
  products: ProductRaw[];
};

const catalogue = catalogueRaw as CatalogueFile;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(price: number | null): string {
  return price === null ? "—" : inr.format(price);
}

function computePriceLabel(p: ProductRaw): string {
  const known = p.variants.map((v) => v.price).filter((n): n is number => n !== null);
  if (known.length === 0) return "Price on request";
  const distinct = new Set(known);
  if (distinct.size === 1) return inr.format(known[0]);
  return `From ${inr.format(Math.min(...known))}`;
}

const imageBySlug = productImages as Record<string, string>;

export const categories: Category[] = catalogue.categories;
export const products: Product[] = catalogue.products.map((p) => ({
  ...p,
  priceLabel: computePriceLabel(p),
  image: imageBySlug[p.slug],
}));

const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
const productBySlug = new Map(products.map((p) => [p.slug, p]));

const productsByCategory = new Map<string, Product[]>();
for (const p of products) {
  const list = productsByCategory.get(p.category) ?? [];
  list.push(p);
  productsByCategory.set(p.category, list);
}

export function getCategory(slug: string): Category | undefined {
  return categoryBySlug.get(slug);
}

export function getProductsByCategory(slug: string): Product[] {
  return productsByCategory.get(slug) ?? [];
}

export function getProductBySlug(slug: string): Product | undefined {
  return productBySlug.get(slug);
}

export function getTopCategories(n: number): Category[] {
  return [...categories]
    .sort(
      (a, b) => getProductsByCategory(b.slug).length - getProductsByCategory(a.slug).length,
    )
    .slice(0, n);
}
