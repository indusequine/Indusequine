import Link from "next/link";
import { LogoMarkPattern } from "@/components/Logo";
import { categoryTileClass } from "@/lib/categoryTileColor";
import type { Category } from "@/data/products";

export function CategoryTile({ category, count }: { category: Category; count: number }) {
  return (
    <Link
      href={`/marketplace/category/${category.slug}`}
      className={`group relative aspect-[4/3] overflow-hidden flex flex-col justify-end p-5 hover:opacity-90 transition-opacity ${categoryTileClass(category.slug)}`}
    >
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <LogoMarkPattern />
      </div>
      <p className="relative font-display text-lg md:text-xl leading-snug">{category.name}</p>
      <p className="relative text-xs opacity-70 mt-1">
        {count} {count === 1 ? "product" : "products"}
      </p>
    </Link>
  );
}
