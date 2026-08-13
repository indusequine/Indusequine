import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CategoryProductBrowser } from "@/components/CategoryProductBrowser";
import { categories, getCategory, getProductsByCategory } from "@/data/products";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  const count = getProductsByCategory(slug).length;
  return {
    title: category.name,
    description: `${count} ${count === 1 ? "product" : "products"} in ${category.name} on the Indusequine marketplace.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const products = getProductsByCategory(slug);

  return (
    <section className="bg-cream-soft py-16 md:py-24">
      <Container size="wide">
        <Link href="/marketplace" className="eyebrow text-brass-deep hover:text-oxblood transition-colors">
          ← All Categories
        </Link>

        <h1 className="font-display text-4xl md:text-5xl mt-6 text-forest leading-tight">
          {category.name}
        </h1>
        <p className="mt-3 text-charcoal">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>

        <div className="mt-12">
          <CategoryProductBrowser products={products} />
        </div>
      </Container>
    </section>
  );
}
