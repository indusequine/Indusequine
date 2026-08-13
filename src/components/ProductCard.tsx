import Link from "next/link";
import type { Product } from "@/data/products";
import { ProductImagePlaceholder } from "@/components/ProductImagePlaceholder";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/marketplace/product/${product.slug}`}
      className="group block border border-forest/15 bg-cream-soft hover:border-forest/40 transition-colors"
    >
      <ProductImagePlaceholder product={product} />
      <div className="p-6">
        <h3 className="font-display text-xl text-forest leading-snug group-hover:text-oxblood transition-colors">
          {product.name}
        </h3>
        <p className="mt-2 text-sm text-charcoal leading-relaxed">
          {product.shortDescription}
        </p>
        <p className="mt-4 eyebrow text-brass-deep">{product.priceLabel}</p>
      </div>
    </Link>
  );
}
