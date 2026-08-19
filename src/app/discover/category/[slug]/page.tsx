import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { DiscoverCategoryBrowser } from "@/components/DiscoverCategoryBrowser";
import { categories, getCategory, getEntriesByCategory } from "@/data/discover";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const count = getEntriesByCategory(slug).length;
  return {
    title: category.name,
    description: `${count} ${count === 1 ? "listing" : "listings"} in ${category.name} on Indusequine Discover.`,
  };
}

export default async function DiscoverCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const entries = getEntriesByCategory(slug);

  return (
    <section className="bg-cream-soft py-16 md:py-24">
      <Container size="wide">
        <Link href="/discover" className="eyebrow text-brass-deep hover:text-oxblood transition-colors">
          ← All Categories
        </Link>

        <h1 className="font-display text-4xl md:text-5xl mt-6 text-forest leading-tight">
          {category.name}
        </h1>
        <p className="mt-3 text-charcoal">
          {entries.length} {entries.length === 1 ? "listing" : "listings"}
        </p>

        <div className="mt-12">
          <DiscoverCategoryBrowser entries={entries} />
        </div>
      </Container>
    </section>
  );
}
