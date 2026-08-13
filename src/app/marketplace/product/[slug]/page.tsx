import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ProductImagePlaceholder } from "@/components/ProductImagePlaceholder";
import { ProductGrid } from "@/components/ProductGrid";
import { EnquiryForm } from "@/components/EnquiryForm";
import { products, getProductBySlug, getProductsByCategory, getCategory } from "@/data/products";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategory(product.category)!;
  const related = getProductsByCategory(product.category).filter((p) => p.slug !== product.slug);

  return (
    <>
      <section className="bg-cream-soft py-16 md:py-20 border-b border-forest/10">
        <Container size="wide">
          <Link
            href={`/marketplace#${category.slug}`}
            className="eyebrow text-brass-deep hover:text-oxblood transition-colors"
          >
            ← {category.eyebrow}
          </Link>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-6">
              <ProductImagePlaceholder product={product} size="detail" />
            </div>

            <div className="lg:col-span-6">
              <h1 className="font-display text-4xl md:text-5xl text-forest leading-tight">
                {product.name}
              </h1>
              {product.origin && (
                <p className="mt-3 text-sm text-stone">Made in {product.origin}</p>
              )}
              <p className="mt-6 text-charcoal leading-relaxed text-lg">
                {product.description}
              </p>

              <dl className="mt-8 space-y-3 border-t border-forest/10 pt-6">
                {product.specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between gap-6 text-sm">
                    <dt className="text-stone">{spec.label}</dt>
                    <dd className="text-ink text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-8 eyebrow text-brass-deep text-base">{product.priceLabel}</p>
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
            <p className="eyebrow text-brass-deep">More in {category.eyebrow}</p>
            <div className="mt-8">
              <ProductGrid products={related} />
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
