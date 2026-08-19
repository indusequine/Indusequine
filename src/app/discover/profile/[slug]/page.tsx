import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { DiscoverImage } from "@/components/DiscoverImage";
import { DiscoverGrid } from "@/components/DiscoverGrid";
import {
  entries,
  getEntryBySlug,
  getEntriesByCategory,
  getCategory,
} from "@/data/discover";

const RELATED_LIMIT = 8;

const SCOPE_LABEL = { national: "National", international: "International" } as const;

export function generateStaticParams() {
  return entries.map((e) => ({ slug: e.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);
  if (!entry) return {};
  const category = getCategory(entry.category);
  const bits = [category?.name, entry.location].filter(Boolean);
  return {
    title: entry.name,
    description: `${entry.summary} ${bits.join(" — ")}.`,
  };
}

export default async function DiscoverProfilePage({ params }: Props) {
  const { slug } = await params;
  const entry = getEntryBySlug(slug);
  if (!entry) notFound();

  const category = getCategory(entry.category)!;
  const related = getEntriesByCategory(entry.category)
    .filter((e) => e.slug !== entry.slug)
    .slice(0, RELATED_LIMIT);
  const totalInCategory = getEntriesByCategory(entry.category).length;

  return (
    <>
      <section className="bg-cream-soft py-16 md:py-20 border-b border-forest/10">
        <Container size="wide">
          <Link
            href={`/discover/category/${category.slug}`}
            className="eyebrow text-brass-deep hover:text-oxblood transition-colors"
          >
            ← {category.name}
          </Link>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-6">
              <DiscoverImage entry={entry} size="detail" />
            </div>

            <div className="lg:col-span-6">
              <p className="eyebrow text-brass-deep">
                {category.name} · {SCOPE_LABEL[entry.scope]}
              </p>
              <h1 className="font-display text-4xl md:text-5xl text-forest leading-tight mt-3">
                {entry.name}
              </h1>
              <p className="mt-3 text-sm text-stone">{entry.location}</p>

              <p className="mt-8 text-charcoal leading-relaxed">{entry.description}</p>

              {entry.focusAreas.length > 0 && (
                <div className="mt-8 border-t border-forest/10 pt-6">
                  <p className="eyebrow text-charcoal mb-3">Focus Areas</p>
                  <ul className="space-y-2">
                    {entry.focusAreas.map((area) => (
                      <li key={area} className="text-sm text-ink flex items-start gap-2">
                        <span className="text-brass-deep mt-0.5">—</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <section className="bg-cream-soft py-16 md:py-20 border-t border-forest/10">
          <Container size="wide">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <p className="eyebrow text-brass-deep">More in {category.name}</p>
              {totalInCategory > RELATED_LIMIT + 1 && (
                <Link
                  href={`/discover/category/${category.slug}`}
                  className="text-sm text-forest hover:text-oxblood underline underline-offset-4"
                >
                  View all {totalInCategory} in {category.name}
                </Link>
              )}
            </div>
            <div className="mt-8">
              <DiscoverGrid entries={related} />
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
