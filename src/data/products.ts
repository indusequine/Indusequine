import { shopifyFetch, fetchAllPages } from "@/lib/shopify/client";
import { brandSlug, brandFromVendor } from "@/lib/brands";
import { categoryTileProduct } from "@/lib/categoryImages";
import { sellerFromTags, type Seller } from "@/lib/sellers";
import {
  PRODUCT_BY_HANDLE_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  COLLECTION_PRODUCTS_QUERY,
  COLLECTIONS_QUERY,
  PRODUCTS_LEAN_QUERY,
  PRODUCTS_BY_VENDOR_QUERY,
} from "@/lib/shopify/queries";
import type {
  ProductByHandleData,
  CollectionByHandleData,
  CollectionProductsData,
  CollectionsData,
  ProductsLeanData,
  ProductsByVendorData,
  ShopifyProductNode,
  ShopifyProductLeanNode,
  ShopifyVariantNode,
} from "@/lib/shopify/types";

export type Variant = {
  sku: string;
  size?: string | null;
  color?: string | null;
  price: number | null;
};

export type Category = { slug: string; name: string };
export type CategoryWithCount = Category & { count: number };

export type Brand = { slug: string; name: string; count: number };

export type Product = {
  slug: string;
  category: string; // category slug
  categoryName: string;
  name: string;
  brand?: string | null;
  variants: Variant[];
  priceLabel: string;
  priceOnRequest: boolean;
  image?: string; // Shopify CDN URL
  description?: string | null; // only populated by getProductBySlug
  seller?: Seller | null; // who sells it, as distinct from who makes it
  inStock: boolean;
};

// Stock is not tracked in Shopify: our suppliers hold it, and each sync marks
// what their site reports. An unmarked product is taken to be in stock, so a
// product that has never been synced reads as available rather than sold out.
const OUT_OF_STOCK_TAGS = ["sync:tack-shop-out-of-stock", "sync:out-of-stock"];

export function inStockFromTags(tags: string[]): boolean {
  return !tags.some((t) => OUT_OF_STOCK_TAGS.includes(t));
}

const PAGE_SIZE = 250;

// Shopify auto-creates a "Home page" collection (handle "frontpage") on
// every store — it's a platform default, not one of our real categories
// (confirmed live: title "Home page", 0 products). Exclude it everywhere.
const RESERVED_COLLECTION_HANDLES = new Set(["frontpage"]);

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(price: number | null): string {
  return price === null ? "—" : inr.format(price);
}

function computePriceLabel(variants: Variant[], priceOnRequest: boolean): string {
  if (priceOnRequest) return "Price on request";
  const known = variants.map((v) => v.price).filter((n): n is number => n !== null);
  if (known.length === 0) return "Price on request";
  const distinct = new Set(known);
  if (distinct.size === 1) return inr.format(known[0]);
  return `From ${inr.format(Math.min(...known))}`;
}

// Tags look like "category:show-jacket", "price-on-request".
function categorySlugFromTags(tags: string[]): string | undefined {
  const tag = tags.find((t) => t.startsWith("category:"));
  return tag?.slice("category:".length);
}

// The migration substituted "One Size"/"Standard" for missing size/color, and
// added a "Variant"/"Title" option for disambiguation/Shopify defaults —
// reverse both so the app sees exactly what it saw before this data source
// changed: real size/color only, or null.
function mapVariant(node: ShopifyVariantNode): Variant {
  let size: string | null = null;
  let color: string | null = null;
  for (const opt of node.selectedOptions) {
    if (opt.name === "Size" && opt.value !== "One Size") size = opt.value;
    if (opt.name === "Color" && opt.value !== "Standard") color = opt.value;
  }
  return {
    sku: node.sku,
    size,
    color,
    price: parseFloat(node.price.amount),
  };
}

function mapProduct(node: ShopifyProductNode, categoryName: string): Product {
  const category = categorySlugFromTags(node.tags) ?? "";
  const priceOnRequest = node.tags.includes("price-on-request");
  const variants = node.variants.edges.map((e) => mapVariant(e.node));
  const brand = brandFromVendor(node.vendor);

  return {
    slug: node.handle,
    category,
    categoryName,
    name: node.title,
    brand,
    variants,
    priceLabel: computePriceLabel(variants, priceOnRequest),
    priceOnRequest,
    image: node.featuredImage?.url,
    description: node.description?.trim() || null,
    seller: sellerFromTags(node.tags),
    inStock: inStockFromTags(node.tags),
  };
}

async function fetchAllProductsLean(): Promise<ShopifyProductLeanNode[]> {
  return fetchAllPages<ShopifyProductLeanNode>(async (cursor) => {
    const data = await shopifyFetch<ProductsLeanData>(PRODUCTS_LEAN_QUERY, {
      first: PAGE_SIZE,
      after: cursor,
    });
    return {
      nodes: data.products.edges.map((e) => e.node),
      hasNextPage: data.products.pageInfo.hasNextPage,
      endCursor: data.products.pageInfo.endCursor,
    };
  });
}

export async function getAllProductSlugs(): Promise<string[]> {
  const nodes = await fetchAllProductsLean();
  return nodes.map((n) => n.handle);
}

export async function getCategories(): Promise<Category[]> {
  const nodes = await fetchAllPages(async (cursor) => {
    const data = await shopifyFetch<CollectionsData>(COLLECTIONS_QUERY, {
      first: PAGE_SIZE,
      after: cursor,
    });
    return {
      nodes: data.collections.edges.map((e) => e.node),
      hasNextPage: data.collections.pageInfo.hasNextPage,
      endCursor: data.collections.pageInfo.endCursor,
    };
  });
  return nodes
    .filter((n) => !RESERVED_COLLECTION_HANDLES.has(n.handle))
    .map((n) => ({ slug: n.handle, name: n.title }));
}

// One lean full-catalogue pass (handle + tags only, no variants/images),
// bucket-counted by category tag — used for both the marketplace index
// grid's per-category counts and getTopCategories, instead of fetching
// each category's full product list (with variants/images) just to
// discard it and keep the length. Shopify's Storefront API has no
// product-count field on Collection, so this is the lean alternative.
async function getCategoryCounts(): Promise<Map<string, number>> {
  const nodes = await fetchAllProductsLean();
  const counts = new Map<string, number>();
  for (const n of nodes) {
    const slug = categorySlugFromTags(n.tags);
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return counts;
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const [categories, counts] = await Promise.all([getCategories(), getCategoryCounts()]);
  return categories.map((c) => ({ ...c, count: counts.get(c.slug) ?? 0 }));
}

// Brands stocked across a set of categories, busiest first. Vendor rides along
// on the lean query, so this costs no extra round trip beyond what the category
// counts already fetch. Vendors that stand for "no brand" are dropped by
// brandFromVendor, the same way mapProduct drops them.
export async function getBrandsForCategorySlugs(
  categorySlugs: string[],
): Promise<string[]> {
  const wanted = new Set(categorySlugs);
  const nodes = await fetchAllProductsLean();
  const counts = new Map<string, number>();
  for (const n of nodes) {
    const slug = categorySlugFromTags(n.tags);
    if (!slug || !wanted.has(slug)) continue;
    const brand = brandFromVendor(n.vendor);
    if (!brand) continue;
    counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([brand]) => brand);
}

export async function getAllBrands(): Promise<Brand[]> {
  const nodes = await fetchAllProductsLean();
  const counts = new Map<string, number>();
  for (const n of nodes) {
    const brand = brandFromVendor(n.vendor);
    if (!brand) continue;
    counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: brandSlug(name), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getBrandBySlug(slug: string): Promise<Brand | undefined> {
  const brands = await getAllBrands();
  return brands.find((b) => b.slug === slug);
}

// One representative photograph per category, for the category tiles. Pass a
// brand to draw from that brand's own stock, so CWD's Saddle tile shows a CWD
// saddle rather than whichever saddle the catalogue happens to list first.
//
// Read off the lean pass, which already carries featuredImage, so this costs no
// extra round trip. Categories whose products have no photography yet are
// absent from the map and their tiles fall back to the flat colour.
export async function getCategoryImages(
  brandName?: string,
): Promise<Map<string, string>> {
  const nodes = await fetchAllProductsLean();
  const images = new Map<string, string>();
  const pinned = new Map<string, string>();

  for (const n of nodes) {
    if (brandName && n.vendor !== brandName) continue;
    const url = n.featuredImage?.url;
    if (!url) continue;
    const slug = categorySlugFromTags(n.tags);
    if (!slug) continue;

    if (categoryTileProduct[slug] === n.handle) pinned.set(slug, url);
    else if (!images.has(slug)) images.set(slug, url);
  }

  // A pinned choice wins over the first-found one.
  for (const [slug, url] of pinned) images.set(slug, url);
  return images;
}

// The categories one brand actually stocks, busiest first. Read off the lean
// pass, so a brand's landing page never has to pull full product records --
// images and variants are only fetched once the rider picks a category.
export async function getBrandCategories(brandName: string): Promise<CategoryWithCount[]> {
  const [nodes, categories] = await Promise.all([fetchAllProductsLean(), getCategories()]);
  const nameBySlug = new Map(categories.map((c) => [c.slug, c.name]));

  const counts = new Map<string, number>();
  for (const n of nodes) {
    if (n.vendor !== brandName) continue;
    const slug = categorySlugFromTags(n.tags);
    if (!slug || !nameBySlug.has(slug)) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, name: nameBySlug.get(slug)!, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// Every brand/category pair in the catalogue, for generateStaticParams. One
// lean pass covers all of them rather than a fetch per brand.
export async function getBrandCategoryPairs(): Promise<
  { brandSlug: string; categorySlug: string }[]
> {
  const [nodes, categories] = await Promise.all([fetchAllProductsLean(), getCategories()]);
  const known = new Set(categories.map((c) => c.slug));

  const pairs = new Set<string>();
  for (const n of nodes) {
    const brand = brandFromVendor(n.vendor);
    const slug = categorySlugFromTags(n.tags);
    if (!brand || !slug || !known.has(slug)) continue;
    pairs.add(`${brandSlug(brand)}|${slug}`);
  }

  return [...pairs].map((p) => {
    const [b, c] = p.split("|");
    return { brandSlug: b, categorySlug: c };
  });
}

export async function getProductsByBrand(brandName: string): Promise<Product[]> {
  const categories = await getCategories();
  const nameBySlug = new Map(categories.map((c) => [c.slug, c.name]));

  const nodes = await fetchAllPages<ShopifyProductNode>(async (cursor) => {
    const data = await shopifyFetch<ProductsByVendorData>(PRODUCTS_BY_VENDOR_QUERY, {
      // Single-quoted so a multi-word vendor matches as one term.
      query: `vendor:'${brandName.replace(/'/g, "\\'")}'`,
      first: PAGE_SIZE,
      after: cursor,
    });
    return {
      nodes: data.products.edges.map((e) => e.node),
      hasNextPage: data.products.pageInfo.hasNextPage,
      endCursor: data.products.pageInfo.endCursor,
    };
  });

  // The vendor: filter is Shopify's own search, which can be fuzzy across
  // similar vendor names -- keep only exact matches so one brand's page never
  // shows another's stock.
  return nodes
    .filter((n) => n.vendor === brandName)
    .map((n) => {
      const slug = categorySlugFromTags(n.tags);
      return mapProduct(n, (slug && nameBySlug.get(slug)) || "");
    });
}

export async function getTopCategories(n: number): Promise<Category[]> {
  const withCounts = await getCategoriesWithCounts();
  return withCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map(({ slug, name }) => ({ slug, name }));
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  if (RESERVED_COLLECTION_HANDLES.has(slug)) return undefined;
  const data = await shopifyFetch<CollectionByHandleData>(COLLECTION_BY_HANDLE_QUERY, {
    handle: slug,
  });
  if (!data.collectionByHandle) return undefined;
  return { slug: data.collectionByHandle.handle, name: data.collectionByHandle.title };
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  let categoryName = slug;
  const nodes = await fetchAllPages<ShopifyProductNode>(async (cursor) => {
    const data = await shopifyFetch<CollectionProductsData>(COLLECTION_PRODUCTS_QUERY, {
      handle: slug,
      first: PAGE_SIZE,
      after: cursor,
    });
    if (!data.collectionByHandle) {
      return { nodes: [], hasNextPage: false, endCursor: null };
    }
    categoryName = data.collectionByHandle.title;
    return {
      nodes: data.collectionByHandle.products.edges.map((e) => e.node),
      hasNextPage: data.collectionByHandle.products.pageInfo.hasNextPage,
      endCursor: data.collectionByHandle.products.pageInfo.endCursor,
    };
  });
  return nodes.map((n) => mapProduct(n, categoryName));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const data = await shopifyFetch<ProductByHandleData>(PRODUCT_BY_HANDLE_QUERY, { handle: slug });
  if (!data.productByHandle) return undefined;
  const node = data.productByHandle;
  const categorySlug = categorySlugFromTags(node.tags);
  const category = categorySlug ? await getCategory(categorySlug) : undefined;
  return mapProduct(node, category?.name ?? "");
}
