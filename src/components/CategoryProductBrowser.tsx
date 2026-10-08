"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/data/products";
import { ProductGrid } from "@/components/ProductGrid";

// Twelve fits both grids whole: six rows of two on a phone, four rows of three
// on a laptop. Twenty-eight of the sixty-three categories hold more than
// fifteen products and the largest holds eighty-two, which is a long way to
// scroll to reach a filter you have already set.
const PAGE_SIZE = 12;

// The order a shop lists them in, not alphabetical.
const GENDER_ORDER = ["women", "men", "kids", "unisex"];

type Sort = "featured" | "price-asc" | "price-desc" | "name";

/** The lowest real price on a product, for sorting and for the range filter.
 *  Products priced on request have none and sort to the end. */
function lowestPrice(product: Product): number | null {
  const prices = product.variants.map((v) => v.price).filter((n): n is number => n !== null);
  return prices.length ? Math.min(...prices) : null;
}

export function CategoryProductBrowser({ products }: { products: Product[] }) {
  const [brand, setBrand] = useState("");
  const [gender, setGender] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");

  // The options come from what is actually in this category, so a filter can
  // never offer a choice that returns nothing.
  const brands = useMemo(
    () =>
      [...new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)))].sort(
        (a, b) => a.localeCompare(b),
      ),
    [products],
  );

  // Clothes carry who they are cut for; equipment does not, so the filter only
  // appears where something in the category has one. Half this catalogue's
  // clothes are untagged because their title never said, and those stay out of
  // every gender rather than being guessed into one.
  const genders = useMemo(() => {
    const found = new Set(products.map((p) => p.gender).filter((g): g is string => Boolean(g)));
    return GENDER_ORDER.filter((g) => found.has(g));
  }, [products]);

  const outOfStockCount = useMemo(() => products.filter((p) => !p.inStock).length, [products]);

  const filtered = useMemo(() => {
    const matching = products.filter((p) => {
      if (brand && p.brand !== brand) return false;
      if (gender && p.gender !== gender) return false;
      if (inStockOnly && !p.inStock) return false;
      return true;
    });

    if (sort === "featured") return matching;
    return [...matching].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const pa = lowestPrice(a);
      const pb = lowestPrice(b);
      if (pa === null) return 1;
      if (pb === null) return -1;
      return sort === "price-asc" ? pa - pb : pb - pa;
    });
  }, [products, brand, gender, inStockOnly, sort]);

  const showFilters = brands.length > 1 || genders.length > 1 || outOfStockCount > 0;
  const narrowed = Boolean(brand || gender || inStockOnly);

  // Back to the first page whenever the list underneath changes, or page 4 of
  // a brand filter becomes page 4 of nothing.
  const [page, setPage] = useState(1);
  const filterKey = `${brand}|${gender}|${inStockOnly}|${sort}`;
  const [seenKey, setSeenKey] = useState(filterKey);
  if (filterKey !== seenKey) {
    setSeenKey(filterKey);
    setPage(1);
  }

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const from = (current - 1) * PAGE_SIZE;
  const shown = filtered.slice(from, from + PAGE_SIZE);

  // Turning a page should put the first product of it where the eye is, not
  // leave the reader halfway down a page they have already seen.
  const top = useRef<HTMLDivElement>(null);
  const turned = useRef(false);
  useEffect(() => {
    if (!turned.current) return;
    turned.current = false;
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [current]);

  const turn = (to: number) => {
    turned.current = true;
    setPage(to);
  };

  const selectClass =
    "px-3 py-2.5 bg-cream-soft border border-forest/15 focus:border-forest focus:outline-none " +
    "focus:ring-1 focus:ring-forest/30 transition-colors text-ink text-sm";

  return (
    <div ref={top} className="scroll-mt-24">
      {showFilters && (
        <div className="mb-10">
          <div className="flex flex-wrap gap-3">
            {brands.length > 1 && (
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                aria-label="Filter by brand"
                className={selectClass}
              >
                <option value="">All brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}

            {genders.length > 1 && (
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                aria-label="Filter by who it is for"
                className={selectClass}
              >
                <option value="">Everyone</option>
                {genders.map((g) => (
                  <option key={g} value={g}>
                    {g === "kids" ? "Kids" : g === "unisex" ? "Unisex" : g === "men" ? "Men" : "Women"}
                  </option>
                ))}
              </select>
            )}

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort products"
              className={selectClass}
            >
              <option value="featured">Sort: featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>

            {outOfStockCount > 0 && (
              <label className="flex items-center gap-2 text-sm text-charcoal px-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-forest w-4 h-4"
                />
                In stock only
              </label>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-stone">
            <span>
              {filtered.length === 0
                ? "Showing none"
                : `Showing ${from + 1}-${from + shown.length} of ${filtered.length}`}
              {filtered.length !== products.length && ` (${products.length} in all)`}
            </span>
            {narrowed && (
              <button
                type="button"
                onClick={() => {
                  setBrand("");
                  setGender("");
                  setInStockOnly(false);
                }}
                className="underline underline-offset-2 hover:text-forest"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <>
          <ProductGrid products={shown} />
          {pages > 1 && (
            <nav
              className="mt-10 flex flex-wrap items-center justify-center gap-2"
              aria-label="Pages"
            >
              <button
                type="button"
                onClick={() => turn(current - 1)}
                disabled={current === 1}
                className={pagerClass}
              >
                Previous
              </button>

              {pageNumbers(current, pages).map((n, i) =>
                n === null ? (
                  <span key={`gap-${i}`} className="px-1 text-stone text-sm">
                    &hellip;
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => turn(n)}
                    aria-current={n === current ? "page" : undefined}
                    className={
                      n === current
                        ? `${pagerClass} bg-forest text-cream-soft border-forest`
                        : pagerClass
                    }
                  >
                    {n}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => turn(current + 1)}
                disabled={current === pages}
                className={pagerClass}
              >
                Next
              </button>
            </nav>
          )}
        </>
      ) : (
        <p className="text-charcoal">
          Nothing here matches that. Try clearing a filter.
        </p>
      )}
    </div>
  );
}

const pagerClass =
  "min-w-10 px-3 py-2 text-sm border border-forest/20 bg-cream-soft text-forest " +
  "hover:border-forest/50 disabled:opacity-40 disabled:hover:border-forest/20 " +
  "disabled:cursor-default transition-colors";

/** First, last, and the pages either side of this one, with gaps marked null.
 *  Eighty-two products is seven pages, which fits; a bigger category would run
 *  off a phone without this. */
function pageNumbers(current: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | null)[] = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(pages - 1, current + 1);
  if (from > 2) out.push(null);
  for (let n = from; n <= to; n += 1) out.push(n);
  if (to < pages - 1) out.push(null);
  out.push(pages);
  return out;
}
