import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import CampaignHero, { type Campaign } from "@/components/CampaignHero";
import BrandStrip from "@/components/BrandStrip";
import CollectionBanner, { type BannerItem } from "@/components/CollectionBanner";
import { categoryGroups } from "@/lib/categoryGroups";
import { shopifyImage } from "@/lib/imageUrl";
import { brandSlug } from "@/lib/brands";
import {
  getAllBrands,
  getCategoriesWithCounts,
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

// The banner shows one real product from one brand, and moves on. Each pairing
// is a brand and a category we hold photographed stock in, so the biggest tile
// on the page is always something a rider can actually buy. It turns over with
// the hourly revalidation rather than on every request, so the page stays
// static and two people looking at once see the same thing.
const BANNERS = [
  { brand: "CWD", category: "bridle-and-reins" },
  { brand: "Kep Italia", category: "helmet" },
  { brand: "Freejump", category: "stirrup-and-stirrup-leathers" },
  { brand: "Fleck", category: "whips" },
  { brand: "Roeckl", category: "gloves" },
  { brand: "Samshield", category: "show-jacket" },
  { brand: "Horseware", category: "fly-sheet" },
];

// Two photographed products from each pairing, so the tile has a dozen or so
// to move through. A pairing whose photography has gone contributes nothing
// rather than leaving a gap.
const PER_PAIRING = 2;

async function collectBanners(categoryName: (slug: string) => string): Promise<BannerItem[]> {
  const lists = await Promise.all(BANNERS.map((b) => getProductsByBrand(b.brand)));
  const items: BannerItem[] = [];
  BANNERS.forEach((choice, index) => {
    const matching = lists[index]
      .filter((p) => p.category === choice.category && p.image)
      .slice(0, PER_PAIRING);
    for (const product of matching) {
      items.push({
        eyebrow: categoryName(choice.category),
        title: choice.brand,
        href: `/marketplace/brand/${brandSlug(choice.brand)}/${choice.category}`,
        image: product.image!,
        alt: product.name,
      });
    }
  });
  return items;
}

export default async function HomePage() {
  const [brands, categories, trendingProducts] = await Promise.all([
    getAllBrands(),
    getCategoriesWithCounts(),
    getProductsByBrand("Freejump"),
  ]);

  const nameFor = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name ?? slug.replace(/-/g, " ");
  const banners = await collectBanners(nameFor);
  // Narrowed here so the tile below can rely on the image being there.
  const trending = trendingProducts.find((p): p is typeof p & { image: string } =>
    Boolean(p.image),
  );

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
            <CollectionBanner items={banners} />

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

            {trending && (
              <Link
                href={`/marketplace/product/${trending.slug}`}
                className="bento__tile bento__tile--product"
              >
                <span className="bento__shot">
                  {/* Shopify-hosted, so it goes through the same resizing helper
                      the product cards use rather than next/image. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shopifyImage(trending.image, 760)} alt="" loading="lazy" />
                </span>
                <span className="bento__caption bento__caption--dark">
                  <small>Trending now</small>
                  {trending.name}
                </span>
              </Link>
            )}
          </div>
        </Container>
      </section>

    </div>
  );
}
