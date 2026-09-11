"use client";

import { useState } from "react";

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
  return [...new Set(labels)]
    .map((s, i) => ({ s, i, k: sizeKey(s) }))
    .sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.k[2] - b.k[2] || a.i - b.i)
    .map((x) => x.s);
}

function distinct(values: string[]): string[] {
  return [...new Set(values)];
}

// Price per value (per size, or per colour) -- only when each value has exactly
// one price and they don't all match; otherwise the price label above covers it.
function pricesBy(variants: PickerVariant[], key: "size" | "color", values: string[]): Map<string, string> | null {
  const map = new Map<string, string>();
  for (const value of values) {
    const prices = distinct(variants.filter((v) => v[key] === value).map((v) => v.priceText));
    if (prices.length !== 1) return null;
    map.set(value, prices[0]);
  }
  return distinct([...map.values()]).length > 1 ? map : null;
}

const chip = "px-4 py-2 border text-sm transition-colors";

export function VariantPicker({ variants: raw }: { variants: PickerVariant[] }) {
  const hasSizes = raw.some((v) => v.size);
  // A variant with no size alongside sized ones is the product's one-size option.
  const variants = raw.map((v) => ({ ...v, size: hasSizes ? (v.size ?? "One Size") : null }));
  const sizes = sortedSizes(variants.flatMap((v) => (v.size ? [v.size] : [])));
  const colors = distinct(variants.flatMap((v) => (v.color ? [v.color] : [])));

  const sizePrices = pricesBy(variants, "size", sizes);
  const colorPrices = sizePrices ? null : pricesBy(variants, "color", colors);

  // Only when some size doesn't come in every colour is there anything to learn
  // by tapping a size -- otherwise both lists already tell the whole story.
  const combos = new Set(variants.map((v) => `${v.size}|${v.color}`));
  const everyComboExists = sizes.every((s) => colors.every((c) => combos.has(`${s}|${c}`)));
  const tappable = sizes.length > 1 && colors.length > 1 && !everyComboExists;

  const [selected, setSelected] = useState<string | null>(null);
  const colorsInSelected = selected ? new Set(variants.filter((v) => v.size === selected).map((v) => v.color)) : null;

  return (
    <div className="mt-6 border-t border-forest/10 pt-6 space-y-6">
      {sizes.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <p className="eyebrow text-charcoal">{sizes.length === 1 ? "Size" : `${sizes.length} Sizes`}</p>
            {tappable && (
              <p className="text-xs text-stone">
                {selected ? "Tap again to show all colours" : "Tap a size to check its colours"}
              </p>
            )}
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const label = sizePrices ? `${s} · ${sizePrices.get(s)}` : s;
              if (!tappable) {
                return (
                  <li key={s} className={`${chip} border-forest/20 bg-cream-soft text-ink`}>
                    {label}
                  </li>
                );
              }
              const active = selected === s;
              return (
                <li key={s}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(active ? null : s)}
                    className={`${chip} focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                      active
                        ? "bg-forest border-forest text-cream-soft"
                        : "bg-cream-soft border-forest/20 text-ink hover:border-forest"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {colors.length > 0 && (
        <div>
          <p className="eyebrow text-charcoal">{colors.length === 1 ? "Colour" : `${colors.length} Colours`}</p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-live="polite">
            {colors.map((c) => {
              const unavailable = colorsInSelected !== null && !colorsInSelected.has(c);
              return (
                <li
                  key={c}
                  className={`${chip} border-forest/15 bg-cream text-charcoal ${unavailable ? "opacity-35 line-through" : ""}`}
                >
                  {c}
                  {colorPrices && <span className="text-stone"> · {colorPrices.get(c)}</span>}
                  {unavailable && <span className="sr-only"> (not available in {selected})</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
