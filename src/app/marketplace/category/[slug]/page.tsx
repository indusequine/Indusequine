import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CategoryProductBrowser } from "@/components/CategoryProductBrowser";
import { getCategories, getCategory, getProductsByCategory } from "@/data/products";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = true;
// Next.js requires route segment config to be a static literal, so this
// can't import REVALIDATE_SECONDS from lib/shopify/client.ts — keep in sync.
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  const count = (await getProductsByCategory(slug)).length;
  return {
    title: category.name,
    description: `${count} ${count === 1 ? "product" : "products"} in ${category.name} on the Indusequine marketplace.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const products = await getProductsByCategory(slug);

  return (
    <section className="bg-cream-soft pt-6 md:pt-10 pb-16 md:pb-24">
      <Container size="fluid">
        {/* Same as a group page: somebody who tapped Helmet does not need to be
            told they are in Helmet, with a count and a way back, before they
            see one. The browser under this already prints how many there are,
            and the filter bar is the thing worth the space. */}
        <h1 className="sr-only">{category.name}</h1>

        <CategoryProductBrowser products={products} />
      </Container>
    </section>
  );
}
