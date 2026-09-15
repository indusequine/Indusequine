import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { LogoMarkPattern } from "@/components/Logo";
import { CategoryGroupTile } from "@/components/CategoryGroupTile";
import { categoryGroups, otherCategorySlugs } from "@/lib/categoryGroups";
import { getCategoriesWithCounts } from "@/data/products";

export const metadata: Metadata = {
  title: "The Marketplace",
  description:
    "Premium equestrian products for India: saddlery, tack, rugs, apparel and grooming, for riders, horses and stables.",
};

// Next.js requires route segment config to be a static literal, so this
// can't import REVALIDATE_SECONDS from lib/shopify/client.ts — keep in sync.
export const revalidate = 3600;

export default async function MarketplacePage() {
  const categories = await getCategoriesWithCounts();
  const countBySlug = new Map(categories.map((c) => [c.slug, c.count]));
  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0);

  const otherCategories = categories.filter((c) => otherCategorySlugs.includes(c.slug));

  return (
    <>
      <PageHero />

      <section className="bg-cream-soft py-16 md:py-20">
        <Container size="wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categoryGroups.map((group) => {
              const productCount = group.categorySlugs.reduce(
                (sum, slug) => sum + (countBySlug.get(slug) ?? 0),
                0,
              );
              return (
                <CategoryGroupTile key={group.slug} group={group} productCount={productCount} />
              );
            })}
          </div>

          {otherCategories.length > 0 && (
            <div className="mt-10 pt-8 border-t border-forest/10 flex flex-wrap items-center gap-x-8 gap-y-3">
              <p className="eyebrow text-brass-deep">Also Browse</p>
              {otherCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/marketplace/category/${c.slug}`}
                  className="text-sm text-charcoal hover:text-oxblood underline underline-offset-4"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      <TrustBadges totalProducts={totalProducts} totalCategories={categories.length} />

      <BrandsCTA />
    </>
  );
}

function TrustBadges({
  totalProducts,
  totalCategories,
}: {
  totalProducts: number;
  totalCategories: number;
}) {
  const badges = [
    { label: "Products Listed", value: `${totalProducts.toLocaleString("en-IN")}+` },
    { label: "Categories", value: `${totalCategories}` },
    { label: "Brands", value: "Verified" },
    { label: "Support", value: "Direct Enquiry" },
  ];
  return (
    <section className="bg-cream py-10 border-y border-forest/10">
      <Container size="wide">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {badges.map((b) => (
            <div key={b.label}>
              <p className="font-display text-2xl md:text-3xl text-forest">{b.value}</p>
              <p className="mt-1 text-xs tracking-wide uppercase text-stone">{b.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function PageHero() {
  return (
    <section className="bg-forest-deep text-cream-soft py-24 md:py-32 relative overflow-hidden border-b border-brass/20">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none text-brass-light">
        <LogoMarkPattern />
      </div>
      <Container className="relative text-center">
        <p className="eyebrow text-brass-light">The Marketplace</p>
        <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[1.05] max-w-4xl mx-auto">
          Every product, for every kind of ride.
        </h1>
        <p className="mt-8 text-lg md:text-xl text-cream-soft/80 leading-relaxed max-w-2xl mx-auto">
          The brands you&rsquo;ve struggled to find in India, and the ones
          you&rsquo;ve only heard about from friends abroad. All under one
          roof.
        </p>
        <p className="mt-4 text-sm text-cream-soft/50 max-w-2xl mx-auto">
          Real listings, real prices. Product photography is on its way.
        </p>
      </Container>
    </section>
  );
}

function BrandsCTA() {
  return (
    <section className="bg-forest text-cream-soft py-24 md:py-28">
      <Container size="narrow" className="text-center">
        <p className="eyebrow text-brass-light">For Brands & Importers</p>
        <h2 className="font-display text-4xl md:text-5xl mt-4 leading-tight">
          Bring your brand to India&rsquo;s riders.
        </h2>
        <p className="mt-6 text-cream-soft/80 leading-relaxed">
          Indian, regional and global. If your work belongs alongside the best
          in the world, we&rsquo;d like to talk. We&rsquo;re building this
          marketplace with the makers who care, not the catalogues that
          don&rsquo;t.
        </p>
        <Link
          href="/contact"
          className="mt-10 inline-flex items-center justify-center px-10 py-4 bg-brass text-forest-deep hover:bg-brass-light transition-colors text-sm tracking-[0.18em] uppercase"
        >
          Partner With Us
        </Link>
      </Container>
    </section>
  );
}
