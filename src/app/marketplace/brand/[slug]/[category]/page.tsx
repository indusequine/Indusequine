import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { CategoryProductBrowser } from "@/components/CategoryProductBrowser";
import {
  getBrandBySlug,
  getBrandCategories,
  getBrandCategoryPairs,
  getProductsByBrand,
} from "@/data/products";

export async function generateStaticParams() {
  const pairs = await getBrandCategoryPairs();
  return pairs.map((p) => ({ slug: p.brandSlug, category: p.categorySlug }));
}

// Next.js requires route segment config to be a static literal, so this
// can't import REVALIDATE_SECONDS from lib/shopify/client.ts — keep in sync.
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string; category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, category } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  const cat = (await getBrandCategories(brand.name)).find((c) => c.slug === category);
  if (!cat) return {};
  return {
    title: `${brand.name} ${cat.name}`,
    description: `${cat.count} ${brand.name} ${cat.name.toLowerCase()} on Indusequine, with real prices, for riders across India.`,
  };
}

export default async function BrandCategoryPage({ params }: Props) {
  const { slug, category } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const categories = await getBrandCategories(brand.name);
  const cat = categories.find((c) => c.slug === category);
  if (!cat) notFound();

  // Cached per brand, so the sibling category pages of one brand share a single
  // fetch rather than each pulling the catalogue again.
  const products = (await getProductsByBrand(brand.name)).filter((p) => p.category === category);
  const siblings = categories.filter((c) => c.slug !== category);

  return (
    <>
      <section className="bg-forest-deep text-cream-soft py-14 md:py-16 border-b border-brass/20">
        <Container size="wide">
          <Link
            href={`/marketplace/brand/${brand.slug}`}
            className="eyebrow text-brass-light hover:text-cream-soft transition-colors"
          >
            ← {brand.name}
          </Link>

          <h1 className="font-display text-4xl md:text-6xl mt-6 leading-[1.05]">
            {brand.name} <span className="italic text-brass-light">{cat.name}</span>
          </h1>
          <p className="eyebrow text-brass-light mt-5">
            {cat.count} {cat.count === 1 ? "product" : "products"}
          </p>

          <Link
            href={`/marketplace/category/${cat.slug}`}
            className="mt-6 inline-flex items-center gap-3 eyebrow text-cream-soft/70 hover:text-brass-light hover:gap-4 transition-all"
          >
            All {cat.name}, every brand <span aria-hidden>→</span>
          </Link>
        </Container>
      </section>

      <section className="bg-cream-soft py-14 md:py-20">
        <Container size="wide">
          <CategoryProductBrowser products={products} />
        </Container>
      </section>

      {siblings.length > 0 && (
        <section className="bg-cream py-14 md:py-16 border-t border-forest/10">
          <Container size="wide">
            <p className="eyebrow text-brass-deep">More from {brand.name}</p>
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              {siblings.map((c) => (
                <Link
                  key={c.slug}
                  href={`/marketplace/brand/${brand.slug}/${c.slug}`}
                  className="text-charcoal hover:text-oxblood underline underline-offset-4 decoration-forest/25 hover:decoration-oxblood transition-colors"
                >
                  {c.name} <span className="mono text-stone text-sm">{c.count}</span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
