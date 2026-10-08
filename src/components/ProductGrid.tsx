import type { Product } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    // Two a row on a phone. One a row meant a single product filled the screen,
    // which is unusable against a catalogue this size: a rider looking for a
    // snaffle had to scroll past thirty of them one at a time. Everything from
    // sm up is exactly as it was, so the desktop grid does not move.
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
