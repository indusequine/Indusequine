/**
 * Pages whose first block is the dark green hero.
 *
 * On these the header used to be a white bar sitting on top of a forest-deep
 * section: two bands with a rule between them, where the eye expects one block.
 * Knowing which pages open dark lets the header take the same ground and the
 * seam disappear.
 *
 * It is a list rather than something measured, because the header renders in
 * the layout, above the page that knows its own first colour. A page added with
 * a dark hero and not added here keeps the white bar -- wrong, but no worse
 * than today, and visible the moment anyone looks.
 */
const DARK_PAGES = new Set([
  "/contact",
  "/discover",
  "/privacy",
  "/services",
  "/story",
  "/terms",
  "/waitlist",
]);

// Both brand pages open on the dark band: /marketplace/brand/samshield and
// /marketplace/brand/samshield/helmet.
const DARK_PATTERN = /^\/marketplace\/brand\/[^/]+(\/[^/]+)?$/;

export function opensOnDark(pathname: string): boolean {
  // trailingSlash is on, so a path may arrive with or without the slash.
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return DARK_PAGES.has(path) || DARK_PATTERN.test(path);
}
