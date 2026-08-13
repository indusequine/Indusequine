import { LogoMarkPattern } from "@/components/Logo";
import type { Product } from "@/data/products";
import { getCategory } from "@/data/products";

type ProductImagePlaceholderProps = {
  product: Product;
  size?: "card" | "detail";
};

export function ProductImagePlaceholder({ product, size = "card" }: ProductImagePlaceholderProps) {
  const category = getCategory(product.category);
  const label = category?.eyebrow ?? "";

  return (
    <div
      role="img"
      aria-label={`${product.name} — sample listing, photography coming soon`}
      className={`relative aspect-square overflow-hidden flex items-center justify-center ${category?.tileClassName ?? "bg-forest-deep text-cream-soft"}`}
    >
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <LogoMarkPattern />
      </div>

      <span
        className={`absolute top-4 left-4 eyebrow bg-cream-soft/95 text-forest-deep px-3 py-1.5 ${size === "detail" ? "text-xs" : "text-[10px]"}`}
      >
        Sample Listing
      </span>

      <p
        className={`relative font-display text-brass-light text-center px-8 leading-tight ${size === "detail" ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"}`}
      >
        {label}
      </p>
    </div>
  );
}
