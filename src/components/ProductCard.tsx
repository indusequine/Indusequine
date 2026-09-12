import Link from "next/link";
import type { Product } from "@/data/products";
import { ProductImage } from "@/components/ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const subtitle = [product.brand, product.categoryName].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/marketplace/product/${product.slug}`}
      // No reveal here on purpose: a category page renders up to 95 of these,
      // and 95 scroll-driven animations is a lot of work for an effect nobody
      // can follow in a dense grid. Reveals stay on sections and tiles.
      className="group block border border-forest/15 bg-cream-soft hover:border-forest/40 transition-colors"
    >
      <ProductImage product={product} />
      <div className="p-6">
        <h3 className="font-display text-xl text-forest leading-snug group-hover:text-oxblood transition-colors">
          {product.name}
        </h3>
        {subtitle && (
          <p className="mt-2 text-sm text-charcoal leading-relaxed">{subtitle}</p>
        )}
        {product.variants.length > 1 && (
          <p className="mt-1 text-xs text-stone">{product.variants.length} options</p>
        )}
        <p className="mt-4 eyebrow text-brass-deep">{product.priceLabel}</p>
      </div>
    </Link>
  );
}
