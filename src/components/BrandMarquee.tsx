type Props = {
  brands: string[];
  /** Seconds for one full pass. Scaled by content so speed reads the same
      whether a group stocks three brands or fourteen. */
  secondsPerBrand?: number;
};

// Enough items in one half of the track to overflow a wide screen. Horse Care
// stocks only three brands, so without repeating, "moving across" would be a
// short clump with a gap behind it.
const MIN_ITEMS_PER_HALF = 12;

export function BrandMarquee({ brands, secondsPerBrand = 3 }: Props) {
  if (brands.length === 0) return null;

  const reps = Math.max(2, Math.ceil(MIN_ITEMS_PER_HALF / brands.length));
  const half = Array.from({ length: reps }, () => brands).flat();
  const duration = half.length * secondsPerBrand;

  return (
    <div className="marquee" aria-label={`Brands in this section: ${brands.join(", ")}`}>
      <div className="marquee-track" style={{ animationDuration: `${duration}s` }}>
        {/* The second copy is what makes the loop seamless -- it's the same
            list again, so it's hidden from screen readers and the label above
            carries the real content. */}
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="flex shrink-0 items-center"
            aria-hidden={copy === 1 ? true : undefined}
          >
            {half.map((brand, i) => (
              <li key={`${copy}-${i}`} className="flex items-center">
                <span className="font-display text-2xl md:text-3xl text-cream-soft/75 whitespace-nowrap">
                  {brand}
                </span>
                <span className="mx-8 md:mx-10 w-1.5 h-1.5 rotate-45 bg-brass/60 shrink-0" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
