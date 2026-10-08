import type { Metadata } from "next";
import CampaignHero, { type Campaign } from "@/components/CampaignHero";
import BrandStrip from "@/components/BrandStrip";
import { Rail } from "@/components/Rail";
import { ProductCard } from "@/components/ProductCard";
import { CategoryTile } from "@/components/CategoryTile";
import {
  getAllBrands,
  getCategoriesWithCounts,
  getCategoryImages,
  getNewArrivals,
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
  const [brands, newArrivals, categories, categoryImages] = await Promise.all([
    getAllBrands(),
    getNewArrivals(12),
    getCategoriesWithCounts(),
    getCategoryImages(),
  ]);

  // Only on the phone, so only the busiest dozen that have a photograph.
  const topCategories = [...categories]
    .filter((c) => c.count > 0 && categoryImages.has(c.slug))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);


  return (
    <div className="home">
      <CampaignHero campaigns={campaigns} />

      {/* The front page is the campaign, what has just arrived, and who we
          carry. Nothing else. Shop by group repeated the hero's own two
          buttons, Shop by category and Trending now were two more rows to
          scroll past, and all of them reached the desktop when only the phone
          had been asked about. */}
      {newArrivals.length > 0 && (
        <Rail title="New in" href="/marketplace" linkLabel="Shop all">
          {newArrivals.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </Rail>
      )}

      {/* On both. Without it there is no route into sixty-three categories
          from the front page at any width. */}
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

    </div>
  );
}
