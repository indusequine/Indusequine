import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { LogoMarkPattern } from "@/components/Logo";
import { ProductGrid } from "@/components/ProductGrid";
import { categories, getProductsByCategory, type Category } from "@/data/products";

export const metadata: Metadata = {
  title: "The Marketplace",
  description:
    "A curated equestrian marketplace for India — premium products for riders, horses, and stables. From saddlery and tack to rugs, apparel, and grooming.",
};

export default function MarketplacePage() {
  return (
    <>
      <PageHero />
      {categories.map((category, i) => (
        <CategorySection key={category.slug} category={category} flip={i % 2 === 1} />
      ))}
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
        <p className="eyebrow text-brass-light">
          The Marketplace
        </p>
        <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[1.05] max-w-4xl">
          Every product, for every kind of ride.
        </h1>
        <p className="mt-8 text-lg md:text-xl text-cream-soft/80 leading-relaxed max-w-2xl">
          The brands you&rsquo;ve struggled to find in India — and the ones
          you&rsquo;ve only heard of from friends abroad. All under one
          well-tended roof.
        </p>
        <p className="mt-4 text-sm text-cream-soft/50 max-w-2xl">
          The categories and listings below are illustrative — full supplier
          catalogues and photography are on their way.
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`#${c.slug}`}
              className="px-5 py-2.5 border border-cream-soft/30 hover:border-brass-light hover:text-brass-light transition-colors text-sm tracking-wide"
            >
              {c.eyebrow}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CategorySection({ category, flip }: { category: Category; flip: boolean }) {
  const products = getProductsByCategory(category.slug);

  return (
    <section
      id={category.slug}
      className={`py-24 md:py-32 scroll-mt-24 ${flip ? "bg-cream" : "bg-cream-soft"}`}
    >
      <Container size="wide">
        <div className="max-w-2xl">
          <p className="eyebrow text-brass-deep">{category.eyebrow}</p>
          <h2 className="font-display text-4xl md:text-5xl mt-4 text-forest leading-tight">
            {category.title}
          </h2>
          <p className="mt-6 text-charcoal leading-relaxed text-lg">
            {category.description}
          </p>
        </div>

        <div className="mt-14">
          <ProductGrid products={products} />
        </div>
      </Container>
    </section>
  );
}

function BrandsCTA() {
  return (
    <section className="bg-forest text-cream-soft py-24 md:py-28">
      <Container size="narrow" className="text-center">
        <p className="eyebrow text-brass-light">
          For Brands & Importers
        </p>
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
