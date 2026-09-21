import { brandSlug } from "@/lib/brands";

// Brands whose logo artwork sits in public/images/brands, named by the same
// slug the brand's page uses. Listing them explicitly means a brand without
// artwork falls back to its name rather than requesting a file that isn't
// there, which is most of the small Indian makers we stock.
//
// To add one: drop <brand-slug>.webp into public/images/brands, trimmed to the
// artwork with no surrounding whitespace and no taller than 180px, and add its
// slug here. WebP because the strip loads all of them at once.
const WITH_LOGO = new Set([
  "animo-italia",
  "ariat",
  "centaur",
  "choplin",
  "cwd",
  "elt",
  "equenatural",
  "equilibrium",
  "equiline",
  "equitheme",
  "eskadron",
  "fleck",
  "for-horses",
  "freejump",
  "haas",
  "helite",
  "horseware",
  "kask",
  "kep-italia",
  "kingsland",
  "mustad",
  "one-k",
  "ovation",
  "professional-s-choice",
  "riding-world",
  "roeckl",
  "samshield",
  "shires",
  "usg",
  "veredus",
  "waldhausen",
]);

export function brandLogo(name: string): string | null {
  const slug = brandSlug(name);
  return WITH_LOGO.has(slug) ? `/images/brands/${slug}.webp` : null;
}

// A few marks are square where most are long wordmarks. At one shared height
// the square ones read as much heavier, so they are held back a little.
const OPTICAL_SCALE: Record<string, number> = {
  fleck: 0.88,
  usg: 0.88,
  ariat: 0.86,
  "for-horses": 0.92,
  equenatural: 0.94,
  eskadron: 0.94,
  shires: 0.94,
  ovation: 0.94,
  "professional-s-choice": 0.9,
};

export function brandLogoScale(name: string): number {
  return OPTICAL_SCALE[brandSlug(name)] ?? 1;
}
