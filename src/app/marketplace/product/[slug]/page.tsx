import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ProductImage } from "@/components/ProductImage";
import { ProductGrid } from "@/components/ProductGrid";
import { EnquiryForm } from "@/components/EnquiryForm";
import {
  products,
  getProductBySlug,
  getProductsByCategory,
  getCategory,
  formatPrice,
} from "@/data/products";

const RELATED_LIMIT = 8;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const category = getCategory(product.category);
  const bits = [product.brand, category?.name, product.priceLabel].filter(Boolean);
  return {
    title: product.name,
    description: `${product.name}. ${bits.join(" — ")}.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategory(product.category)!;
  const related = getProductsByCategory(product.category)
    .filter((p) => p.slug !== product.slug)
    .slice(0, RELATED_LIMIT);
  const totalInCategory = getProductsByCategory(product.category).length;

  return (
    <>
      <section className="bg-cream-soft py-16 md:py-20 border-b border-forest/10">
        <Container size="wide">
          <Link
            href={`/marketplace/category/${category.slug}`}
            className="eyebrow text-brass-deep hover:text-oxblood transition-colors"
          >
            ← {category.name}
          </Link>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-6">
              <ProductImage product={product} size="detail" />
            </div>

            <div className="lg:col-span-6">
              {product.brand && (
                <p className="eyebrow text-brass-deep">{product.brand}</p>
              )}
              <h1 className="font-display text-4xl md:text-5xl text-forest leading-tight mt-3">
                {product.name}
              </h1>
              <p className="mt-3 text-sm text-stone">{category.name}</p>

              <p className="mt-8 eyebrow text-brass-deep text-base">{product.priceLabel}</p>

              {product.variants.length > 1 ? (
                <div className="mt-6 border-t border-forest/10 pt-6">
                  <p className="eyebrow text-charcoal mb-3">
                    {product.variants.length} Options
                  </p>
                  <div className="divide-y divide-forest/10">
                    {product.variants.map((v) => (
                      <div key={v.sku} className="flex justify-between gap-6 py-2 text-sm">
                        <dt className="text-stone">
                          {[v.size, v.color].filter(Boolean).join(" / ") || v.sku}
                        </dt>
                        <dd className="text-ink text-right">{formatPrice(v.price)}</dd>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-xs text-stone">SKU: {product.variants[0]?.sku}</p>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-cream py-16 md:py-24">
        <Container size="narrow">
          <p className="eyebrow text-forest text-center">Interested?</p>
          <h2 className="font-display text-3xl md:text-4xl text-forest text-center mt-3 leading-tight">
            Ask us about the {product.name}.
          </h2>
          <div className="mt-10">
            <EnquiryForm productSlug={product.slug} productName={product.name} />
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
                  href={`/marketplace/category/${category.slug}`}
                  className="text-sm text-forest hover:text-oxblood underline underline-offset-4"
                >
                  View all {totalInCategory} in {category.name}
                </Link>
              )}
            </div>
            <div className="mt-8">
              <ProductGrid products={related} />
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
