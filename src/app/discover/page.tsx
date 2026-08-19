import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { LogoMarkPattern } from "@/components/Logo";
import { CategoryTile } from "@/components/CategoryTile";
import { categories, getEntriesByCategory } from "@/data/discover";

export const metadata: Metadata = {
  title: "Discover",
  description:
    "Equine therapy centres, clinics, and training programmes — national and international — for riders and horses across India.",
};

export default function DiscoverPage() {
  return (
    <>
      <PageHero />

      <section className="bg-cream-soft py-16 md:py-20">
        <Container size="wide">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <CategoryTile
                key={category.slug}
                category={category}
                count={getEntriesByCategory(category.slug).length}
                href={`/discover/category/${category.slug}`}
                countLabel="listings"
              />
            ))}
          </div>
        </Container>
      </section>

      <SuggestCTA />
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
        <p className="eyebrow text-brass-light">Discover</p>
        <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[1.05] max-w-4xl">
          Beyond the tack room.
        </h1>
        <p className="mt-8 text-lg md:text-xl text-cream-soft/80 leading-relaxed max-w-2xl">
          Equine therapy centres, clinics, and training programmes — the
          people and places that keep horses and riders at their best, in
          India and abroad.
        </p>
        <p className="mt-4 text-sm text-cream-soft/50 max-w-2xl">
          Illustrative listings — real centres, clinics, and programmes are
          being verified now.
        </p>
      </Container>
    </section>
  );
}

function SuggestCTA() {
  return (
    <section className="bg-oxblood text-cream-soft py-24 md:py-28">
      <Container size="narrow" className="text-center">
        <p className="eyebrow text-brass-light">Know One We Should List?</p>
        <h2 className="font-display text-4xl md:text-5xl mt-4 leading-tight">
          Help us build a trustworthy directory.
        </h2>
        <p className="mt-6 text-cream-soft/80 leading-relaxed">
          If you run, or know of, a therapy centre, clinic, or training
          programme worth listing here, we&rsquo;d like to hear about it —
          every real listing gets verified before it goes live.
        </p>
        <Link
          href="/contact"
          className="mt-10 inline-flex items-center justify-center px-10 py-4 bg-cream-soft text-oxblood hover:bg-cream transition-colors text-sm tracking-[0.18em] uppercase"
        >
          Suggest a Listing
        </Link>
      </Container>
    </section>
  );
}
