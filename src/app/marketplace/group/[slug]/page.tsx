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
  return (
    <section className="bg-cream-soft pt-6 md:pt-10 pb-16 md:pb-24">
      <Container size="fluid">
        {/* Somebody who tapped Rider knows they tapped Rider. Saying it back to
            them, with the tagline, a count and a way to undo it, was four lines
            of cream before the first category. The heading stays for screen
            readers and search engines without taking any of them, which is what
            Shop All does one level up. */}
        <h1 className="sr-only">{group.name}</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
