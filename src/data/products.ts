import { shopifyFetch, fetchAllPages } from "@/lib/shopify/client";
import {
  PRODUCT_BY_HANDLE_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  COLLECTION_PRODUCTS_QUERY,
  COLLECTIONS_QUERY,
  PRODUCTS_LEAN_QUERY,
} from "@/lib/shopify/queries";
import type {
  ProductByHandleData,
  CollectionByHandleData,
  CollectionProductsData,
  CollectionsData,
  ProductsLeanData,
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
};

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
  // Migration set vendor = brand ?? "Indusequine"; reverse that fallback.
  const brand = node.vendor === "Indusequine" ? null : node.vendor;

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
