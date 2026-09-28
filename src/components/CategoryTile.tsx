import Link from "next/link";
import { LogoMarkPattern } from "@/components/Logo";
import { shopifyImage } from "@/lib/imageUrl";
import { categoryTileFill } from "@/lib/categoryImages";

type CategoryTileProps = {
  category: { slug: string; name: string };
  count: number;
  href: string;
  countLabel?: string;
  /** A product photograph from this category. Falls back to the logo pattern
      when the category has no photography yet. */
  image?: string;
};

export function CategoryTile({ category, count, href, countLabel, image }: CategoryTileProps) {
  const fill = categoryTileFill.has(category.slug);
  return (
    <Link
      href={href}
      className="group block border border-forest/[0.18] bg-cream-soft hover:border-forest/40 transition-colors"
    >
      {/* The catalogue is cut-out product shots on white, so the picture is
          contained rather than cropped, and multiply drops its white ground
          onto the warm one -- no gradient, nothing sliced off at the edge.
          The handful of categories with no clean cut-out fill the frame
          instead; blending those would only make them muddy. */}
      <div className="relative aspect-[4/3] bg-cream-warm overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shopifyImage(image, 600)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            // An <img> is a replaced element: with width/height auto it takes
            // its intrinsic size and ignores insets, and a percentage height has
            // no definite basis inside an auto-sized grid row -- both of which
            // left tall pictures rendering at full height and clipped by the
            // well. Explicit w/h over inset-0 is the combination that holds.
            // The padding is the breathing room a floating product needs;
            // object-fit works inside it, so a filling one simply has none.
            className={`absolute inset-0 w-full h-full transition-transform duration-500 ease-out group-hover:scale-[1.04] ${
              fill ? "object-cover" : "object-contain mix-blend-multiply p-5"
            }`}
          />
        ) : (
          <div className="absolute inset-0 opacity-[0.12] text-brass-deep pointer-events-none">
            <LogoMarkPattern />
          </div>
        )}
      </div>

      <div className="px-4 pt-3.5 pb-4 border-t border-forest/[0.12]">
        <p className="font-display text-lg md:text-xl leading-snug text-forest">
          {category.name}
        </p>
        <p className="eyebrow text-brass-deep mt-1.5">
          {count} {countLabel ?? (count === 1 ? "product" : "products")}
        </p>
      </div>
    </Link>
  );
}
