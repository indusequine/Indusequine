import Link from "next/link";
import type { Metadata } from "next";
import CampaignHero, { type Campaign } from "@/components/CampaignHero";
import BrandStrip from "@/components/BrandStrip";
import { Rail } from "@/components/Rail";
import { CategoryTile } from "@/components/CategoryTile";
import { ProductCard } from "@/components/ProductCard";
import { categoryGroups } from "@/lib/categoryGroups";
import { brandSlug } from "@/lib/brands";
import {
  getAllBrands,
  getCategoriesWithCounts,
  getCategoryImages,
  getProductsByBrand,
} from "@/data/products";

export const metadata: Metadata = {
  title: "Indusequine",
  description:
    "India's equestrian marketplace. Saddlery, helmets, show wear and horse care from the brands Indian riders already ride in.",
};

// Next.js requires route segment config to be a static literal, so this
// can't import REVALIDATE_SECONDS from lib/shopify/client.ts, keep in sync.
export const revalidate = 3600;

// Placeholder artwork until the founder's campaign photography lands. The
// structure is what matters here: swapping these three images, or pointing one
// at a video, is a change to this list alone.
const campaigns: Campaign[] = [
  {
    eyebrow: "India's equestrian marketplace",
    title: "Everything\nFor The Ride.",
    body: "Saddlery, helmets, show wear and horse care, all in one place.",
    image: "/images/hero-wide.jpg",
    priority: true,
    actions: [
      { label: "Shop Rider", href: "/marketplace/group/rider" },
      { label: "Shop Horse", href: "/marketplace/group/horse" },
    ],
  },
  {
    eyebrow: "Services",
    title: "Coaches, Vets\nAnd Farriers.",
    body: "Find the professionals Indian riders already trust.",
    image: "/images/rider-medal-bw.jpg",
    actions: [{ label: "Find a professional", href: "/services" }],
  },
  {
    eyebrow: "Discover",
    title: "Therapy, Clinics\nAnd Shows.",
    body: "Everything beyond the tack room, in one place.",
    image: "/images/discover-hero.jpg",
    actions: [{ label: "Explore Discover", href: "/discover" }],
  },
];

export default async function HomePage() {
  const [brands, categories, trendingProducts, categoryImages] = await Promise.all([
    getAllBrands(),
    getCategoriesWithCounts(),
    getProductsByBrand("Freejump"),
    getCategoryImages(),
  ]);

  // The busiest categories that actually have a photograph, so no rail tile
  // falls back to the logo pattern while a photographed one waits behind it.
  const topCategories = [...categories]
    .filter((c) => c.count > 0 && categoryImages.has(c.slug))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  const trendingRail = trendingProducts.filter((p) => p.image).slice(0, 10);

  return (
    <div className="home">
      <CampaignHero campaigns={campaigns} />

      {/* Rows rather than one stacked block. The block put a banner and a
          trending product side by side in the markup and full width on a
          phone, so two screens went by before a rider met a category. Four
          rows now occupy about the space those two did, and each one says
          what it holds by showing a piece of the next tile. */}
      <Rail title="Shop by group" href="/marketplace" linkLabel="All categories" wide>
        {categoryGroups.map((group) => (
          <Link key={group.slug} href={`/marketplace/group/${group.slug}`} className="bento__tile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={group.image} alt="" />
            <span className="bento__caption">{group.name}</span>
          </Link>
        ))}
      </Rail>

      <Rail title="Shop by category" href="/marketplace" linkLabel="All categories">
        {topCategories.map((category) => (
          <CategoryTile
            key={category.slug}
            category={category}
            count={category.count}
            href={`/marketplace/category/${category.slug}`}
            image={categoryImages.get(category.slug)}
          />
        ))}
      </Rail>

      <BrandStrip brands={brands} />

      {trendingRail.length > 0 && (
        <Rail title="Trending now" href={`/marketplace/brand/${brandSlug("Freejump")}`}>
          {trendingRail.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </Rail>
      )}

    </div>
  );
}
