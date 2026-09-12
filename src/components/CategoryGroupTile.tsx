import Link from "next/link";
import type { CategoryGroup } from "@/lib/categoryGroups";

type CategoryGroupTileProps = {
  group: CategoryGroup;
  productCount: number;
};

export function CategoryGroupTile({ group, productCount }: CategoryGroupTileProps) {
  return (
    <Link
      href={`/marketplace/group/${group.slug}`}
      className="group relative aspect-[3/4] overflow-hidden block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        loading="lazy"
        decoding="async"
        src={group.image}
        alt={group.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/40 to-forest-deep/60" />

      <div className="relative h-full flex flex-col justify-end p-6 md:p-8 text-cream-soft">
        <p className="eyebrow text-brass-light">
          {productCount} {productCount === 1 ? "Product" : "Products"}
        </p>
        <h3 className="font-display text-3xl md:text-4xl mt-3 leading-tight">
          {group.name}
        </h3>
        <p className="mt-2 text-sm text-cream-soft/80 leading-relaxed max-w-xs">
          {group.tagline}
        </p>
      </div>
    </Link>
  );
}
