import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CategoryTile } from "@/components/CategoryTile";
import { categoryGroups, getGroupBySlug } from "@/lib/categoryGroups";
import { getCategoriesWithCounts, getCategoryImages } from "@/data/products";

export function generateStaticParams() {
  return categoryGroups.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const group = getGroupBySlug(slug);
  if (!group) return {};
  return {
    title: group.name,
    description: `${group.tagline} Browse ${group.name.toLowerCase()} categories on the Indusequine marketplace.`,
  };
}

export default async function GroupPage({ params }: Props) {
  const { slug } = await params;
  const group = getGroupBySlug(slug);
  if (!group) notFound();

  // Both read the same lean pass, so the photographs cost no extra round trip.
  const [allCategories, images] = await Promise.all([
    getCategoriesWithCounts(),
    getCategoryImages(),
  ]);
  // A category with nothing live in it is a dead end, so it is not offered.
  // Photographed ones lead, because a wall of flat colour tiles reads as a
  // site that has not been finished.
  const categories = allCategories
    .filter((c) => group.categorySlugs.includes(c.slug) && c.count > 0)
    .sort((a, b) => {
      const byPhoto = Number(Boolean(images.get(b.slug))) - Number(Boolean(images.get(a.slug)));
      return byPhoto || b.count - a.count;
    });
  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <section className="bg-cream-soft py-16 md:py-24">
      <Container size="wide">
        <Link href="/marketplace" className="eyebrow text-brass-deep hover:text-oxblood transition-colors">
          ← The Marketplace
        </Link>

        <h1 className="font-display text-4xl md:text-5xl mt-6 text-forest leading-tight">
          {group.name}
        </h1>
        <p className="mt-3 text-charcoal leading-relaxed max-w-xl">{group.tagline}</p>
        <p className="mt-2 text-sm text-stone">
          {totalProducts} products across {categories.length} categories
        </p>

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <CategoryTile
              key={category.slug}
              category={category}
              count={category.count}
              href={`/marketplace/category/${category.slug}`}
              image={images.get(category.slug)}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
