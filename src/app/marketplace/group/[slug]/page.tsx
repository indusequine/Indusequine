import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CategoryTile } from "@/components/CategoryTile";
import { BrandMarquee } from "@/components/BrandMarquee";
import { categoryGroups, getGroupBySlug } from "@/lib/categoryGroups";
import {
  getBrandsForCategorySlugs,
  getCategoriesWithCounts,
  getCategoryImages,
} from "@/data/products";

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

  const [allCategories, brands, images] = await Promise.all([
    getCategoriesWithCounts(),
    getBrandsForCategorySlugs(group.categorySlugs),
    getCategoryImages(),
  ]);
  const categories = allCategories.filter((c) => group.categorySlugs.includes(c.slug));
  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <>
      <section className="bg-forest-deep text-cream-soft pt-16 md:pt-20 pb-10 md:pb-12 border-b border-brass/20">
        <Container size="wide">
          <Link
            href="/marketplace"
            className="eyebrow text-brass-light hover:text-cream-soft transition-colors"
          >
            ← The Marketplace
          </Link>

          <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[1.05]">
            {group.name}
          </h1>
          <p className="mt-4 text-lg text-cream-soft/75 leading-relaxed max-w-xl">
            {group.tagline}
          </p>
          <p className="eyebrow text-brass-light mt-6">
            {totalProducts.toLocaleString("en-IN")} products · {categories.length} categories
            {brands.length > 0 && ` · ${brands.length} brands`}
          </p>
        </Container>

        {/* Full-bleed, so the names really do travel the width of the screen. */}
        <div className="mt-12 md:mt-14 border-t border-brass/15 pt-8 md:pt-10">
          <BrandMarquee brands={brands} />
        </div>
      </section>

      <section className="bg-cream-soft py-16 md:py-24">
        <Container size="wide">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <CategoryTile
                key={category.slug}
                category={category}
                count={category.count}
                image={images.get(category.slug)}
                href={`/marketplace/category/${category.slug}`}
              />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
