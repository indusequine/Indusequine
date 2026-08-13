const PALETTE = [
  "bg-forest-deep text-cream-soft",
  "bg-forest text-cream-soft",
  "bg-forest-soft text-cream-soft",
  "bg-oxblood text-cream-soft",
  "bg-oxblood-deep text-cream-soft",
  "bg-brass-deep text-cream-soft",
  "bg-charcoal text-cream-soft",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function categoryTileClass(slug: string): string {
  return PALETTE[hashString(slug) % PALETTE.length];
}
