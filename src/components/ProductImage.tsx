import { LogoMarkPattern } from "@/components/Logo";
import type { Product } from "@/data/products";
import { categoryTileClass } from "@/lib/categoryTileColor";

type ProductImageProps = {
  product: Product;
  size?: "card" | "detail";
};

export function ProductImage({ product, size = "card" }: ProductImageProps) {
  if (product.image) {
    return (
      <div className="relative aspect-square overflow-hidden bg-cream-warm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  const label = product.categoryName ?? "";

  return (
    <div
      role="img"
      aria-label={`${product.name} — photography coming soon`}
      className={`relative aspect-square overflow-hidden flex items-center justify-center ${categoryTileClass(product.category)}`}
    >
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <LogoMarkPattern />
      </div>

      <span
        className={`absolute top-4 left-4 eyebrow bg-cream-soft/95 text-forest-deep px-3 py-1.5 ${size === "detail" ? "text-xs" : "text-[10px]"}`}
      >
        Photography Coming Soon
      </span>

      <p
        className={`relative font-display text-brass-light text-center px-8 leading-tight ${size === "detail" ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"}`}
      >
        {label}
      </p>
    </div>
  );
}
