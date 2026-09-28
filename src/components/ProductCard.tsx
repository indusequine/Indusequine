import Link from "next/link";
import type { Product } from "@/data/products";
import { ProductImage } from "@/components/ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const subtitle = [product.brand, product.categoryName].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/marketplace/product/${product.slug}`}
      className="group block border border-forest/15 bg-cream-soft hover:border-forest/40 transition-colors"
    >
      <div className="relative">
        <ProductImage product={product} />
        {!product.inStock && (
          <span className="absolute top-3 left-3 bg-cream-soft/95 text-charcoal text-[0.6875rem] font-semibold uppercase tracking-wider px-2.5 py-1 border border-forest/15">
            Out of stock
          </span>
        )}
      </div>
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
        {product.priceLabel && (
          <p className="mt-4 eyebrow text-brass-deep">{product.priceLabel}</p>
        )}
      </div>
    </Link>
  );
}
