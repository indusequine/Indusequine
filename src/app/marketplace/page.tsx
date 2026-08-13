import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { LogoMarkPattern } from "@/components/Logo";
import { CategoryTile } from "@/components/CategoryTile";
import { categories, getProductsByCategory } from "@/data/products";

export const metadata: Metadata = {
  title: "The Marketplace",
  description:
    "A curated equestrian marketplace for India — premium products for riders, horses, and stables. From saddlery and tack to rugs, apparel, and grooming.",
};

export default function MarketplacePage() {
  const sortedCategories = [...categories].sort(
    (a, b) => getProductsByCategory(b.slug).length - getProductsByCategory(a.slug).length,
  );

  return (
    <>
      <PageHero />

      <section className="bg-cream-soft py-16 md:py-20">
        <Container size="wide">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedCategories.map((category) => (
              <CategoryTile
                key={category.slug}
                category={category}
                count={getProductsByCategory(category.slug).length}
              />
            ))}
          </div>
        </Container>
      </section>

      <BrandsCTA />
    </>
  );
}

function PageHero() {
  return (
    <section className="bg-forest-deep text-cream-soft py-24 md:py-32 relative overflow-hidden border-b border-brass/20">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none text-brass-light">
        <LogoMarkPattern />
      </div>
      <Container className="relative">
        <p className="eyebrow text-brass-light">The Marketplace</p>
        <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[1.05] max-w-4xl">
          Every product, for every kind of ride.
        </h1>
        <p className="mt-8 text-lg md:text-xl text-cream-soft/80 leading-relaxed max-w-2xl">
          The brands you&rsquo;ve struggled to find in India — and the ones
          you&rsquo;ve only heard of from friends abroad. All under one
          well-tended roof.
        </p>
        <p className="mt-4 text-sm text-cream-soft/50 max-w-2xl">
          Real listings, real prices — product photography is on its way.
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
          Indian, regional, and global brands — if your work belongs alongside
          the best in the world, we&rsquo;d like to talk. We&rsquo;re building
          this marketplace with the makers who care, not the catalogues that
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
