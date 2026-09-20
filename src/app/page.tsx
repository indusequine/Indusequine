import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import CampaignHero, { type Campaign } from "@/components/CampaignHero";
import BrandStrip from "@/components/BrandStrip";
import { CategoryGroupTile } from "@/components/CategoryGroupTile";
import { ProductCard } from "@/components/ProductCard";
import { categoryGroups } from "@/lib/categoryGroups";
import {
  getAllBrands,
  getCategoriesWithCounts,
  getProductsByCategory,
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
    title: "Everything for the ride.",
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
    title: "Coaches, vets and farriers.",
    body: "Find the professionals Indian riders already trust.",
    image: "/images/rider-medal-bw.jpg",
    actions: [{ label: "Find a professional", href: "/services" }],
  },
  {
    eyebrow: "Discover",
    title: "Therapy, clinics, training and shows.",
    body: "Everything beyond the tack room, in one place.",
    image: "/images/discover-hero.jpg",
    actions: [{ label: "Explore Discover", href: "/discover" }],
  },
];

// The rail needs a category with enough photographed products to fill a row.
const RAIL_CATEGORY = "helmet";
const RAIL_LENGTH = 4;

export default async function HomePage() {
  const [brands, categories, railProducts] = await Promise.all([
    getAllBrands(),
    getCategoriesWithCounts(),
    getProductsByCategory(RAIL_CATEGORY),
  ]);

  const countBySlug = new Map(categories.map((c) => [c.slug, c.count]));
  const rail = railProducts.filter((p) => p.image).slice(0, RAIL_LENGTH);
  const railName = categories.find((c) => c.slug === RAIL_CATEGORY)?.name ?? "New in";

  return (
    <>
      <CampaignHero campaigns={campaigns} />

      <BrandStrip brands={brands} />

      <section className="bg-cream-soft py-12 md:py-16 border-t border-forest/10">
        <Container size="wide">
          <div className="mb-8 flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl md:text-3xl text-forest-deep">
              Shop the collections
            </h2>
            <Link
              href="/marketplace"
              className="text-sm font-semibold text-forest underline underline-offset-4 whitespace-nowrap hover:text-forest-deep"
            >
              All categories
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoryGroups.map((group) => (
              <CategoryGroupTile
                key={group.slug}
                group={group}
                productCount={group.categorySlugs.reduce(
                  (sum, slug) => sum + (countBySlug.get(slug) ?? 0),
                  0,
                )}
              />
            ))}
          </div>
        </Container>
      </section>

      {rail.length > 0 && (
        <section className="py-12 md:py-16">
          <Container size="wide">
            <div className="mb-8 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl md:text-3xl text-forest-deep">{railName}</h2>
              <Link
                href={`/marketplace/category/${RAIL_CATEGORY}`}
                className="text-sm font-semibold text-forest underline underline-offset-4 whitespace-nowrap hover:text-forest-deep"
              >
                See all
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {rail.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
