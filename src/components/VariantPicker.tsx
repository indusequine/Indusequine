"use client";

import { useMemo, useState } from "react";

export type PickerVariant = {
  size: string | null;
  color: string | null;
  priceText: string;
};

const SIZE_RANK: Record<string, number> = {
  XXXS: 0, XXS: 1, XS: 2, "X-SMALL": 2, S: 3, SMALL: 3, M: 4, MEDIUM: 4,
  L: 5, LARGE: 5, XL: 6, "X-LARGE": 6, XXL: 7, "2XL": 7, XXXL: 8, "3XL": 8,
  // short / tall fits sit just either side of their base size
  SS: 2.7, ST: 3.3, MS: 3.7, MT: 4.3, LS: 4.7, LT: 5.3, XLS: 5.7, XLT: 6.3,
  SHETLAND: 20, PONY: 21, COB: 22, FULL: 23, "X-FULL": 24, XFULL: 24, "EXTRA FULL": 24, WARMBLOOD: 24,
};

function rankOf(token: string): number | undefined {
  if (token in SIZE_RANK) return SIZE_RANK[token];
  const parts = token.split("/"); // "S/M", "XS/S" -> between the two
  if (parts.length > 1 && parts.every((p) => p in SIZE_RANK)) {
    return parts.reduce((sum, p) => sum + SIZE_RANK[p], 0) / parts.length;
  }
  return undefined;
}

// [group, primary, secondary] -- numbers first (28", FR40/IN30, 110 cms), then
// clothing/horse size words (XS..XXL, Pony..Full), then anything unrecognised
// in the order the inventory listed it.
function sizeKey(size: string): [number, number, number] {
  const num = size.match(/^(?:FR|IN)?\s*(\d+(?:\.\d+)?)(?:\D+(\d+(?:\.\d+)?))?/i);
  if (num) return [0, parseFloat(num[1]), num[2] ? parseFloat(num[2]) : 0];
  const upper = size.toUpperCase().trim();
  const whole = rankOf(upper);
  if (whole !== undefined) return [1, whole, 0];
  for (const token of upper.split(/[\s()\-]+/)) {
    const rank = rankOf(token);
    if (rank !== undefined) return [1, rank, 0];
  }
  return [2, 0, 0];
}

function sortedSizes(labels: string[]): string[] {
  const unique = [...new Set(labels)];
  return unique
    .map((s, i) => ({ s, i, k: sizeKey(s) }))
    .sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.k[2] - b.k[2] || a.i - b.i)
    .map((x) => x.s);
}

function distinct(values: string[]): string[] {
  return [...new Set(values)];
}

// showPrice is false when the whole product has one price -- it's already
// shown above the picker, so repeating it here is just noise.
function Options({ variants, showPrice }: { variants: PickerVariant[]; showPrice: boolean }) {
  const prices = distinct(variants.map((v) => v.priceText));
  const colors = distinct(variants.map((v) => v.color).filter((c): c is string => Boolean(c)));
  const uniform = prices.length === 1;

  return (
    <div>
      {showPrice && (uniform || colors.length === 0) && (
        <p className="eyebrow text-brass-deep text-base">{prices.join(" / ")}</p>
      )}
      {colors.length > 0 && (
        <>
          <p className={`eyebrow text-charcoal ${showPrice && uniform ? "mt-5" : ""}`}>
            {colors.length === 1 ? "Colour" : `${colors.length} Colours`}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {colors.map((c) => (
              <li key={c} className="px-3 py-1.5 border border-forest/15 bg-cream text-sm text-charcoal">
                {c}
                {!uniform && (
                  <span className="text-stone">
                    {" · "}
                    {distinct(variants.filter((v) => v.color === c).map((v) => v.priceText)).join(" / ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function VariantPicker({ variants }: { variants: PickerVariant[] }) {
  const hasSizes = variants.some((v) => v.size);
  // A variant with no size alongside sized ones is the product's one-size option.
  const labelled = useMemo(
    () => variants.map((v) => ({ ...v, size: hasSizes ? (v.size ?? "One Size") : null })),
    [variants, hasSizes],
  );
  const sizes = useMemo(() => sortedSizes(labelled.flatMap((v) => (v.size ? [v.size] : []))), [labelled]);
  const [selected, setSelected] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);

  const singlePrice = distinct(variants.map((v) => v.priceText)).length === 1;
  const hasColors = variants.some((v) => v.color);

  if (!hasSizes) {
    return (
      <div className="mt-6 border-t border-forest/10 pt-6">
        <Options variants={labelled} showPrice={!singlePrice} />
      </div>
    );
  }

  const sizeLabel = (
    <p className="eyebrow text-charcoal">{sizes.length === 1 ? "Size" : `${sizes.length} Sizes`}</p>
  );

  // Nothing differs between sizes (no colours, one price) -- nothing to reveal,
  // so show the sizes as plain labels rather than buttons that do nothing.
  if (!hasColors && singlePrice) {
    return (
      <div className="mt-6 border-t border-forest/10 pt-6">
        {sizeLabel}
        <ul className="mt-3 flex flex-wrap gap-2">
          {sizes.map((s) => (
            <li key={s} className="px-4 py-2 border border-forest/20 bg-cream-soft text-sm text-ink">{s}</li>
          ))}
        </ul>
      </div>
    );
  }

  const hint = hasColors
    ? singlePrice ? "Select a size to see colours" : "Select a size to see colours and price"
    : "Select a size to see its price";

  return (
    <div className="mt-6 border-t border-forest/10 pt-6">
      <div className="flex items-baseline justify-between gap-4">
        {sizeLabel}
        {!selected && <p className="text-xs text-stone">{hint}</p>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {sizes.map((s) => {
          const active = selected === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(active ? null : s)}
              className={`px-4 py-2 border text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                active
                  ? "bg-forest border-forest text-cream-soft"
                  : "bg-cream-soft border-forest/20 text-ink hover:border-forest"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-5">
        {selected && <Options variants={labelled.filter((v) => v.size === selected)} showPrice={!singlePrice} />}
      </div>
    </div>
  );
}
