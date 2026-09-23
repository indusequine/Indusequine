"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { ProductGrid } from "@/components/ProductGrid";

const SEARCH_THRESHOLD = 12;

type Sort = "featured" | "price-asc" | "price-desc" | "name";

/** The lowest real price on a product, for sorting and for the range filter.
 *  Products priced on request have none and sort to the end. */
function lowestPrice(product: Product): number | null {
  const prices = product.variants.map((v) => v.price).filter((n): n is number => n !== null);
  return prices.length ? Math.min(...prices) : null;
}

export function CategoryProductBrowser({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
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

  const sizes = useMemo(() => {
    const found = new Set<string>();
    for (const p of products) for (const v of p.variants) if (v.size) found.add(v.size);
    return [...found].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [products]);

  const outOfStockCount = useMemo(() => products.filter((p) => !p.inStock).length, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.brand?.toLowerCase().includes(q)) {
        return false;
      }
      if (brand && p.brand !== brand) return false;
      if (size && !p.variants.some((v) => v.size === size)) return false;
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
  }, [products, query, brand, size, inStockOnly, sort]);

  const showSearch = products.length > SEARCH_THRESHOLD;
  const showFilters = brands.length > 1 || sizes.length > 1 || outOfStockCount > 0;
  const narrowed = Boolean(query || brand || size || inStockOnly);

  const selectClass =
    "px-3 py-2.5 bg-cream-soft border border-forest/15 focus:border-forest focus:outline-none " +
    "focus:ring-1 focus:ring-forest/30 transition-colors text-ink text-sm";

  return (
    <div>
      {(showSearch || showFilters) && (
        <div className="mb-10">
          <div className="flex flex-wrap gap-3">
            {showSearch && (
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or brand…"
                aria-label="Search within this category"
                className={`${selectClass} w-full sm:w-64 py-3`}
              />
            )}

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

            {sizes.length > 1 && (
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                aria-label="Filter by size"
                className={selectClass}
              >
                <option value="">All sizes</option>
                {sizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
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
              Showing {filtered.length} of {products.length}
            </span>
            {narrowed && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setBrand("");
                  setSize("");
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
        <ProductGrid products={filtered} />
      ) : (
        <p className="text-charcoal">
          Nothing here matches that. Try clearing a filter.
        </p>
      )}
    </div>
  );
}
