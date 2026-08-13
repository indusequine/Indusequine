"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { ProductGrid } from "@/components/ProductGrid";

const SEARCH_THRESHOLD = 12;

export function CategoryProductBrowser({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <div>
      {products.length > SEARCH_THRESHOLD && (
        <div className="mb-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or brand…"
            className="w-full md:max-w-sm px-4 py-3 bg-cream-soft border border-forest/15 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30 transition-colors text-ink"
          />
          <p className="mt-2 text-xs text-stone">
            Showing {filtered.length} of {products.length}
          </p>
        </div>
      )}

      {filtered.length > 0 ? (
        <ProductGrid products={filtered} />
      ) : (
        <p className="text-charcoal">No products match &ldquo;{query}&rdquo;.</p>
      )}
    </div>
  );
}
