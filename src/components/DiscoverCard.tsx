import Link from "next/link";
import type { DiscoverEntry } from "@/data/discover";
import { getCategory } from "@/data/discover";
import { DiscoverImage } from "@/components/DiscoverImage";

const SCOPE_LABEL = { national: "National", international: "International" } as const;

export function DiscoverCard({ entry }: { entry: DiscoverEntry }) {
  const category = getCategory(entry.category);
  const subtitle = [category?.name, SCOPE_LABEL[entry.scope]].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/discover/profile/${entry.slug}`}
      className="group block border border-forest/15 bg-cream-soft hover:border-forest/40 transition-colors"
    >
      <DiscoverImage entry={entry} />
      <div className="p-6">
        <h3 className="font-display text-xl text-forest leading-snug group-hover:text-oxblood transition-colors">
          {entry.name}
        </h3>
        {subtitle && (
          <p className="mt-2 text-sm text-charcoal leading-relaxed">{subtitle}</p>
        )}
        <p className="mt-4 text-sm text-stone leading-relaxed">{entry.summary}</p>
      </div>
    </Link>
  );
}
