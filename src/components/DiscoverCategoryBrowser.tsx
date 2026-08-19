"use client";

import { useMemo, useState } from "react";
import type { DiscoverEntry, DiscoverScope } from "@/data/discover";
import { DiscoverGrid } from "@/components/DiscoverGrid";

type Filter = "all" | DiscoverScope;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "national", label: "National" },
  { value: "international", label: "International" },
];

export function DiscoverCategoryBrowser({ entries }: { entries: DiscoverEntry[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => e.scope === filter);
  }, [entries, filter]);

  return (
    <div>
      <div className="mb-10 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-sm tracking-wide border transition-colors ${
              filter === f.value
                ? "bg-forest text-cream-soft border-forest"
                : "bg-cream-soft text-charcoal border-forest/15 hover:border-forest/40"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <DiscoverGrid entries={filtered} />
      ) : (
        <p className="text-charcoal">No {filter} listings in this category yet.</p>
      )}
    </div>
  );
}
