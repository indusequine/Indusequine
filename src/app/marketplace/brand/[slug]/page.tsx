import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CategoryTile } from "@/components/CategoryTile";
import {
  getAllBrands,
  getBrandBySlug,
  getBrandCategories,
  getCategoryImages,
} from "@/data/products";

export async function generateStaticParams() {
  const brands = await getAllBrands();
  return brands.map((b) => ({ slug: b.slug }));
}

// Next.js requires route segment config to be a static literal, so this
// can't import REVALIDATE_SECONDS from lib/shopify/client.ts — keep in sync.
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  return {
    title: brand.name,
    description: `Shop ${brand.name} on Indusequine — ${brand.count} products, with real prices, for riders across India.`,
  };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const [categories, images] = await Promise.all([
    getBrandCategories(brand.name),
    // Drawn from this brand's own stock, so CWD's Saddle tile shows a CWD saddle.
    getCategoryImages(brand.name),
  ]);
  const total = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <>
      <section className="bg-forest-deep text-cream-soft py-16 md:py-20 border-b border-brass/20">
        <Container size="wide">
          <Link
            href="/marketplace"
            className="eyebrow text-brass-light hover:text-cream-soft transition-colors"
          >
            ← The Marketplace
          </Link>

          <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[1.05]">{brand.name}</h1>
          <p className="eyebrow text-brass-light mt-6">
            {total.toLocaleString("en-IN")} products · {categories.length}{" "}
            {categories.length === 1 ? "category" : "categories"}
          </p>
        </Container>
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
                href={`/marketplace/brand/${brand.slug}/${category.slug}`}
              />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
