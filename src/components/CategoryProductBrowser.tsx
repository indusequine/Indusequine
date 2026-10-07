"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { ProductGrid } from "@/components/ProductGrid";

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

  const selectClass =
    "px-3 py-2.5 bg-cream-soft border border-forest/15 focus:border-forest focus:outline-none " +
    "focus:ring-1 focus:ring-forest/30 transition-colors text-ink text-sm";

  return (
    <div>
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
              Showing {filtered.length} of {products.length}
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
        <ProductGrid products={filtered} />
      ) : (
        <p className="text-charcoal">
          Nothing here matches that. Try clearing a filter.
        </p>
      )}
    </div>
  );
}
