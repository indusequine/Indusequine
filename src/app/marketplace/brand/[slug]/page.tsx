import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ProductCard } from "@/components/ProductCard";
import { getAllBrands, getBrandBySlug, getProductsByBrand } from "@/data/products";
import type { Product } from "@/data/products";

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

  const products = await getProductsByBrand(brand.name);

  // Group by category, busiest first -- a rider who came looking for Samshield
  // wants to see that it's breeches, show jackets and helmets, then pick one.
  const byCategory = new Map<string, { name: string; slug: string; products: Product[] }>();
  for (const p of products) {
    const key = p.category || "other";
    const existing = byCategory.get(key);
    if (existing) existing.products.push(p);
    else byCategory.set(key, { name: p.categoryName || "More", slug: p.category, products: [p] });
  }
  const groups = [...byCategory.values()].sort(
    (a, b) => b.products.length - a.products.length || a.name.localeCompare(b.name),
  );

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
            {products.length.toLocaleString("en-IN")} products · {groups.length}{" "}
            {groups.length === 1 ? "category" : "categories"}
          </p>

          {groups.length > 1 && (
            <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-3" aria-label="Jump to a category">
              {groups.map((g) => (
                <a
                  key={g.slug}
                  href={`#${g.slug}`}
                  className="text-sm text-cream-soft/70 hover:text-brass-light underline underline-offset-4 decoration-cream-soft/25 hover:decoration-brass-light transition-colors"
                >
                  {g.name}{" "}
                  <span className="mono text-cream-soft/40">{g.products.length}</span>
                </a>
              ))}
            </nav>
          )}
        </Container>
      </section>

      {groups.map((group) => (
        <section
          key={group.slug}
          id={group.slug}
          className="bg-cream-soft py-14 md:py-20 scroll-mt-24 even:bg-cream"
        >
          <Container size="wide">
            <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
              <h2 className="font-display text-3xl md:text-4xl text-forest leading-tight">
                {group.name}
              </h2>
              <Link
                href={`/marketplace/category/${group.slug}`}
                className="eyebrow text-brass-deep hover:text-oxblood transition-colors"
              >
                All {group.name} <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {group.products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </Container>
        </section>
      ))}
    </>
  );
}
