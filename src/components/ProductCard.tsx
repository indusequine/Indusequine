import Link from "next/link";
import type { Product } from "@/data/products";
import { ProductImage } from "@/components/ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const subtitle = [product.brand, product.categoryName].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/marketplace/product/${product.slug}`}
      className="group flex flex-col border border-forest/15 bg-cream-soft hover:border-forest/40 transition-colors"
    >
      <div className="relative">
        <ProductImage product={product} />
        {!product.inStock && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-cream-soft/95 text-charcoal text-[0.5625rem] sm:text-[0.6875rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 sm:px-2.5 sm:py-1 border border-forest/15">
            Out of stock
          </span>
        )}
      </div>
      {/* Half the padding and half the type on a phone, where two of these sit
          side by side rather than one filling the screen. */}
      <div className="flex flex-col flex-1 p-3 sm:p-6">
        <h3 className="font-display text-[0.9375rem] leading-tight line-clamp-2 sm:text-xl sm:leading-snug sm:line-clamp-none text-forest group-hover:text-oxblood transition-colors">
          {product.name}
        </h3>
        {subtitle && (
          <p className="mt-1 sm:mt-2 text-[0.6875rem] sm:text-sm text-charcoal leading-snug sm:leading-relaxed line-clamp-1 sm:line-clamp-none">
            {subtitle}
          </p>
        )}
        {product.variants.length > 1 && (
          <p className="mt-0.5 sm:mt-1 text-[0.625rem] sm:text-xs text-stone">
            {product.variants.length} options
          </p>
        )}
        {product.priceLabel && (
          <p className="eyebrow text-brass-deep mt-2 pt-1 sm:mt-4 sm:pt-0 text-[0.6875rem] sm:text-inherit">
            {product.priceLabel}
          </p>
        )}
      </div>
    </Link>
  );
}
