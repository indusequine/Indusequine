import { LogoMarkPattern } from "@/components/Logo";
import type { DiscoverEntry } from "@/data/discover";
import { getCategory } from "@/data/discover";
import { categoryTileClass } from "@/lib/categoryTileColor";

type DiscoverImageProps = {
  entry: DiscoverEntry;
  size?: "card" | "detail";
};

export function DiscoverImage({ entry, size = "card" }: DiscoverImageProps) {
  if (entry.image) {
    return (
      <div className="relative aspect-square overflow-hidden bg-cream-warm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.image}
          alt={entry.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  const category = getCategory(entry.category);
  const label = category?.name ?? "";

  return (
    <div
      role="img"
      aria-label={`${entry.name} — illustrative placeholder`}
      className={`relative aspect-square overflow-hidden flex items-center justify-center ${categoryTileClass(entry.category)}`}
    >
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
        <LogoMarkPattern />
      </div>

      <span
        className={`absolute top-4 left-4 eyebrow bg-cream-soft/95 text-forest-deep px-3 py-1.5 ${size === "detail" ? "text-xs" : "text-[10px]"}`}
      >
        Illustrative Placeholder
      </span>

      <p
        className={`relative font-display text-brass-light text-center px-8 leading-tight ${size === "detail" ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"}`}
      >
        {label}
      </p>
    </div>
  );
}
