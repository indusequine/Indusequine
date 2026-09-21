import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import CampaignHero, { type Campaign } from "@/components/CampaignHero";
import BrandStrip from "@/components/BrandStrip";
import { ProductCard } from "@/components/ProductCard";
import { categoryGroups } from "@/lib/categoryGroups";
import { shopifyImage } from "@/lib/imageUrl";
import {
  getAllBrands,
  getCategoriesWithCounts,
  getProductsByBrand,
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

// The bento's cover tile. A real brand with real depth behind it, so the
// biggest thing on the page leads somewhere worth landing.
const COVER = {
  eyebrow: "Saddlery",
  title: "CWD",
  href: "/marketplace/brand/cwd",
  image: "/images/rider-embrace.jpg",
};

const RAIL_CATEGORY = "helmet";

export default async function HomePage() {
  const [brands, categories, railProducts, coverProducts] = await Promise.all([
    getAllBrands(),
    getCategoriesWithCounts(),
    getProductsByCategory(RAIL_CATEGORY),
    getProductsByBrand("Freejump"),
  ]);

  const rail = railProducts.filter((p) => p.image).slice(0, 4);
  const railName = categories.find((c) => c.slug === RAIL_CATEGORY)?.name ?? "New in";
  // Narrowed here so the tile below can rely on the image being there.
  const spotlight = coverProducts.find((p): p is typeof p & { image: string } => Boolean(p.image));

  return (
    <div className="home">
      <CampaignHero campaigns={campaigns} />

      <BrandStrip brands={brands} />

      <section className="home__section border-t border-black/10">
        <Container size="wide">
          <div className="home__head">
            <h2>Shop the collections</h2>
            <Link href="/marketplace">All categories</Link>
          </div>

          <div className="bento">
            <Link href={COVER.href} className="bento__tile bento__tile--cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={COVER.image} alt="" />
              <span className="bento__caption">
                <small>{COVER.eyebrow}</small>
                {COVER.title}
              </span>
            </Link>

            {categoryGroups.map((group) => (
              <Link
                key={group.slug}
                href={`/marketplace/group/${group.slug}`}
                className="bento__tile"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={group.image} alt="" />
                <span className="bento__caption">{group.name}</span>
              </Link>
            ))}

            {spotlight && (
              <Link
                href={`/marketplace/product/${spotlight.slug}`}
                className="bento__tile bento__tile--product"
              >
                <span className="bento__shot">
                  {/* Shopify-hosted, so it goes through the same resizing helper
                      the product cards use rather than next/image. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shopifyImage(spotlight.image, 760)} alt="" loading="lazy" />
                </span>
                <span className="bento__caption bento__caption--dark">
                  <small>{spotlight.brand}</small>
                  {spotlight.name}
                </span>
              </Link>
            )}
          </div>
        </Container>
      </section>

      {rail.length > 0 && (
        <section className="home__section">
          <Container size="wide">
            <div className="home__head">
              <h2>{railName}</h2>
              <Link href={`/marketplace/category/${RAIL_CATEGORY}`}>See all</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {rail.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}
