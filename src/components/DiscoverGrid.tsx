import type { DiscoverEntry } from "@/data/discover";
import { DiscoverCard } from "@/components/DiscoverCard";

export function DiscoverGrid({ entries }: { entries: DiscoverEntry[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {entries.map((entry) => (
        <DiscoverCard key={entry.slug} entry={entry} />
      ))}
    </div>
  );
}
