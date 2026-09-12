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

// Price per size (or per colour) -- only when each value has exactly one price
// and they don't all match; otherwise the price above the picker covers it.
function pricesBy(variants: PickerVariant[], key: "size" | "color", values: string[]): Map<string, string> | null {
  const map = new Map<string, string>();
  for (const value of values) {
    const prices = distinct(variants.filter((v) => v[key] === value).map((v) => v.priceText));
    if (prices.length !== 1) return null;
    map.set(value, prices[0]);
  }
  return distinct([...map.values()]).length > 1 ? map : null;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"
      className={`shrink-0 text-forest transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M3 6 L8 11 L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dropdown({
  label, options, selected, onSelect, prices, unavailable,
}: {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  prices: Map<string, string> | null;
  unavailable: Set<string> | null;
}) {
  const [open, setOpen] = useState(false);
  const summary = selected ?? `${options.length} ${options.length === 1 ? "option" : "options"}`;

  return (
    <div className="flex-1 min-w-[220px] border border-forest/20 bg-cream-soft">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
      >
        <span>
          <span className="eyebrow text-charcoal block">{label}</span>
          <span className={`text-sm ${selected ? "text-ink" : "text-stone"}`}>{summary}</span>
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-forest/10">
          <ul className="flex flex-wrap gap-2">
            {options.map((option) => {
              const off = unavailable?.has(option) ?? false;
              const active = selected === option;
              return (
                <li key={option}>
                  <button
                    type="button"
                    disabled={off}
                    aria-pressed={active}
                    onClick={() => {
                      onSelect(active ? null : option);
                      setOpen(false);
                    }}
                    className={`px-3 py-1.5 border text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 ${
                      active
                        ? "bg-forest border-forest text-cream-soft"
                        : off
                          ? "border-forest/10 bg-cream text-stone/50 line-through cursor-not-allowed"
                          : "border-forest/15 bg-cream text-charcoal hover:border-forest"
                    }`}
                  >
                    {option}
                    {prices && <span className={active ? "" : "text-stone"}> · {prices.get(option)}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          {selected && (
            <button
              type="button"
              onClick={() => { onSelect(null); setOpen(false); }}
              className="mt-3 text-xs text-stone hover:text-oxblood underline underline-offset-4"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function VariantPicker({ variants: raw }: { variants: PickerVariant[] }) {
  const hasSizes = raw.some((v) => v.size);
  // A variant with no size alongside sized ones is the product's one-size option.
  const variants = raw.map((v) => ({ ...v, size: hasSizes ? (v.size ?? "One Size") : null }));
  const sizes = sortedSizes(variants.flatMap((v) => (v.size ? [v.size] : [])));
  const colors = distinct(variants.flatMap((v) => (v.color ? [v.color] : [])));

  const sizePrices = pricesBy(variants, "size", sizes);
  const colorPrices = sizePrices ? null : pricesBy(variants, "color", colors);

  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);

  const sizesForColor = color ? new Set(variants.filter((v) => v.color === color).map((v) => v.size)) : null;
  const colorsForSize = size ? new Set(variants.filter((v) => v.size === size).map((v) => v.color)) : null;

  const matching = variants.filter((v) => (!size || v.size === size) && (!color || v.color === color));
  const matchingPrices = distinct(matching.map((v) => v.priceText));
  const exactPrice = (size || color) && matchingPrices.length === 1 ? matchingPrices[0] : null;

  return (
    <div className="mt-6 border-t border-forest/10 pt-6">
      <div className="flex flex-wrap items-start gap-3">
        {sizes.length > 0 && (
          <Dropdown
            label="Size"
            options={sizes}
            selected={size}
            onSelect={setSize}
            prices={sizePrices}
            unavailable={sizesForColor ? new Set(sizes.filter((s) => !sizesForColor.has(s))) : null}
          />
        )}
        {colors.length > 0 && (
          <Dropdown
            label="Colour"
            options={colors}
            selected={color}
            onSelect={setColor}
            prices={colorPrices}
            unavailable={colorsForSize ? new Set(colors.filter((c) => !colorsForSize.has(c))) : null}
          />
        )}
      </div>

      {exactPrice && <p className="mt-4 eyebrow text-brass-deep text-base">{exactPrice}</p>}
    </div>
  );
}
