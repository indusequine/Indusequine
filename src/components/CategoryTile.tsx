import Link from "next/link";
import { LogoMarkPattern } from "@/components/Logo";
import { categoryTileClass } from "@/lib/categoryTileColor";
import { shopifyImage } from "@/lib/categoryImages";

type CategoryTileProps = {
  category: { slug: string; name: string };
  count: number;
  href: string;
  countLabel?: string;
  /** A product photograph from this category. Falls back to the flat colour
      when the category has no photography yet. */
  image?: string;
};

export function CategoryTile({ category, count, href, countLabel, image }: CategoryTileProps) {
  return (
    <Link
      href={href}
      className={`group relative aspect-[4/3] overflow-hidden flex flex-col justify-end p-5 transition-opacity ${
        image ? "bg-forest-deep" : `hover:opacity-90 ${categoryTileClass(category.slug)}`
      }`}
    >
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shopifyImage(image, 600)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* The label needs a dark ground to sit on, but these are catalogue
              cut-outs on white -- a wash across the whole tile turns them grey.
              So the gradient is heavy at the bottom where the text is and clears
              by a third of the way up, leaving the product its own colour. */}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep from-12% via-forest-deep/75 via-30% to-transparent to-55%" />
        </>
      ) : (
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <LogoMarkPattern />
        </div>
      )}

      <p className="relative font-display text-lg md:text-xl leading-snug text-cream-soft">
        {category.name}
      </p>
      <p className="relative text-xs text-cream-soft/70 mt-1">
        {count} {countLabel ?? (count === 1 ? "product" : "products")}
      </p>
    </Link>
  );
}
