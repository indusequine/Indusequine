import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
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
      <section className="bg-cream-soft pt-10 md:pt-14 pb-16 md:pb-20">
        <Container size="wide">
          {/* The campaign belongs on the homepage. Here a rider has already
              chosen to shop, so the page opens on the three groups. The heading
              stays because a page needs one, but it keeps out of the way. */}
          <h1 className="font-display text-3xl md:text-4xl text-forest-deep mb-8">
            Shop all
          </h1>

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
