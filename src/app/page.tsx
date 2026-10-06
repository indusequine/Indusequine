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
  getNewArrivals,
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
  const [brands, categories, trendingProducts, categoryImages, newArrivals] =
    await Promise.all([
      getAllBrands(),
      getCategoriesWithCounts(),
      getProductsByBrand("Freejump"),
      getCategoryImages(),
      getNewArrivals(12),
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

      {/* The front page on a phone is three things: the campaign, what has
          just arrived, and who we carry. Shop by group repeats the hero's own
          two buttons and Trending now is a fourth row nobody asked to scroll,
          so both stay on the desktop and come off the phone. */}
      {newArrivals.length > 0 && (
        <Rail title="New in" href="/marketplace" linkLabel="Shop all">
          {newArrivals.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </Rail>
      )}

      <Rail title="Shop by group" href="/marketplace" linkLabel="All categories" wide desktopOnly>
        {categoryGroups.map((group) => (
          <Link key={group.slug} href={`/marketplace/group/${group.slug}`} className="bento__tile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={group.image} alt="" />
            <span className="bento__caption">{group.name}</span>
          </Link>
        ))}
      </Rail>

      {/* The one row kept against the founder's shorter list: without it a
          phone has no route into sixty-three categories but the menu. */}
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
        <Rail title="Trending now" href={`/marketplace/brand/${brandSlug("Freejump")}`} desktopOnly>
          {trendingRail.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </Rail>
      )}

    </div>
  );
}
