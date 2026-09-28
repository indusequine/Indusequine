import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { brandLogo, brandLogoScale } from "@/lib/brandLogos";
import { getAllBrands } from "@/data/products";

export const metadata: Metadata = {
  title: "All Brands",
  description:
    "Every brand on Indusequine, from Freejump and Samshield to the Indian makers, with the products we stock from each.",
};

// Next.js requires route segment config to be a static literal, so this
// can't import REVALIDATE_SECONDS from lib/shopify/client.ts, keep in sync.
export const revalidate = 3600;

export default async function BrandsPage() {
  const brands = await getAllBrands();

  return (
    <div className="bg-cream-soft">
      <Container size="wide">
        <div className="py-14 md:py-20">
          <h1 className="font-display text-3xl md:text-4xl text-forest-deep">All brands</h1>
          <p className="mt-3 text-forest/70 max-w-prose">
            {brands.length} brands, from the European saddleries to the Indian makers. Not every
            brand has sent us their artwork yet, so some show their name instead.
          </p>

          <ul className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-forest/10 border border-forest/10">
            {brands.map((brand) => {
              const logo = brandLogo(brand.name);
              return (
                <li key={brand.slug} className="bg-cream-soft">
                  <Link
                    href={`/marketplace/brand/${brand.slug}`}
                    className="block h-full px-4 py-6 text-center hover:bg-white transition-colors"
                  >
                    <span className="flex h-12 items-center justify-center">
                      {logo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={logo}
                          alt={brand.name}
                          className="w-auto max-w-full object-contain"
                          style={{ maxHeight: `${brandLogoScale(brand.name) * 100}%` }}
                        />
                      ) : (
                        <span className="text-sm font-semibold uppercase tracking-wide text-forest-deep">
                          {brand.name}
                        </span>
                      )}
                    </span>
                    <span className="mt-4 block text-xs text-forest/60">
                      {brand.count} {brand.count === 1 ? "product" : "products"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </div>
  );
}
