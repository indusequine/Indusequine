import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ProductCard } from "@/components/ProductCard";
import { searchCatalogue } from "@/data/products";
import { matchSections } from "@/lib/siteSections";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Indusequine marketplace, services and discover.",
};

// Next.js requires route segment config to be a static literal, so this
// can't import REVALIDATE_SECONDS from lib/shopify/client.ts, keep in sync.
export const revalidate = 3600;

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  if (!query) {
    return (
      <div className="bg-cream-soft">
        <Container size="wide">
          <div className="py-16 md:py-24 max-w-2xl">
            <h1 className="font-display text-3xl md:text-4xl text-forest-deep">Search</h1>
            <p className="mt-3 text-charcoal leading-relaxed">
              Look for a product, a brand, or something from Services and Discover. Try
              &ldquo;helmet&rdquo;, &ldquo;Kask&rdquo;, or &ldquo;farrier&rdquo;.
            </p>
            <form action="/search" className="mt-8 flex gap-3">
              <input
                type="search"
                name="q"
                autoFocus
                aria-label="Search"
                placeholder="Search the whole site"
                className="flex-1 px-4 py-3 bg-white border border-forest/15 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30 text-ink"
              />
              <button type="submit" className="px-5 py-3 bg-forest text-cream-soft text-sm font-semibold">
                Search
              </button>
            </form>
          </div>
        </Container>
      </div>
    );
  }

  // Both are read off passes the site already makes, so a search costs one
  // round trip to Shopify rather than a search service.
  const [products, sections] = await Promise.all([
    searchCatalogue(query),
    Promise.resolve(matchSections(query)),
  ]);

  const services = sections.filter((s) => s.area === "Services");
  const discover = sections.filter((s) => s.area === "Discover");
  const total = products.length + sections.length;

  return (
    <div className="bg-cream-soft">
      <Container size="wide">
        <div className="py-12 md:py-16">
          <h1 className="font-display text-3xl md:text-4xl text-forest-deep">
            &ldquo;{query}&rdquo;
          </h1>
          <p className="mt-2 text-sm text-stone">
            {total === 0
              ? "Nothing matched."
              : `${total} ${total === 1 ? "result" : "results"} across the marketplace, services and discover`}
          </p>

          <form action="/search" className="mt-6 flex gap-3 max-w-lg">
            <input
              type="search"
              name="q"
              defaultValue={query}
              aria-label="Search"
              className="flex-1 px-4 py-2.5 bg-white border border-forest/15 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest/30 text-ink"
            />
            <button type="submit" className="px-5 py-2.5 bg-forest text-cream-soft text-sm font-semibold">
              Search
            </button>
          </form>

          {total === 0 && (
            <p className="mt-10 text-charcoal max-w-prose">
              No product, brand or section matches that. Try a shorter word, or browse{" "}
              <Link href="/marketplace" className="underline underline-offset-4">
                the marketplace
              </Link>
              .
            </p>
          )}

          {products.length > 0 && (
            <section className="mt-12">
              <h2 className="eyebrow text-brass-deep">Marketplace · {products.length}</h2>
              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((hit) => (
                  <ProductCard
                    key={hit.slug}
                    product={{
                      slug: hit.slug,
                      name: hit.name,
                      brand: hit.brand,
                      category: hit.categorySlug,
                      categoryName: hit.categoryName,
                      image: hit.image,
                      inStock: hit.inStock,
                      // The lean pass carries no prices, and fetching 60
                      // products in full to print one line each is not worth
                      // the round trips. The product page has them.
                      variants: [],
                      priceLabel: "",
                      priceOnRequest: false,
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {[["Services", services], ["Discover", discover]].map(([label, list]) => {
            const items = list as typeof services;
            if (!items.length) return null;
            return (
              <section className="mt-12" key={label as string}>
                <h2 className="eyebrow text-brass-deep">
                  {label as string} · {items.length}
                </h2>
                <div className="mt-6 space-y-3">
                  {items.map((section) => (
                    <Link
                      key={section.href}
                      href={section.href}
                      className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border border-forest/15 bg-white px-5 py-4 hover:border-forest/40 transition-colors"
                    >
                      <span className="font-display text-xl text-forest">{section.title}</span>
                      <span className="text-sm text-stone">{section.blurb}</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
