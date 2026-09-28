import type { MetadataRoute } from "next";
import {
  getCategories,
  getAllProductSlugs,
  getAllBrands,
  getBrandCategoryPairs,
} from "@/data/products";
import { categoryGroups } from "@/lib/categoryGroups";

const BASE_URL = "https://indusequine.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [categories, productSlugs, brands, brandCategories] = await Promise.all([
    getCategories(),
    getAllProductSlugs(),
    getAllBrands(),
    getBrandCategoryPairs(),
  ]);

  return [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/marketplace`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/discover`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/story`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/waitlist`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    ...categoryGroups.map((g) => ({
      url: `${BASE_URL}/marketplace/group/${g.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...brands.map((b) => ({
      url: `${BASE_URL}/marketplace/brand/${b.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...brandCategories.map((p) => ({
      url: `${BASE_URL}/marketplace/brand/${p.brandSlug}/${p.categorySlug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...categories.map((c) => ({
      url: `${BASE_URL}/marketplace/category/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...productSlugs.map((slug) => ({
      url: `${BASE_URL}/marketplace/product/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
