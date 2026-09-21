import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/Container";
import { brandSlug } from "@/lib/brands";
import { brandLogo, brandLogoScale } from "@/lib/brandLogos";
import type { Brand } from "@/data/products";

const LOGO_HEIGHT = 50;

/**
 * Deal the brands that have artwork together with the ones that don't, so the
 * nameplates sit among the logos instead of trailing after them. Sorting by
 * product count alone would bunch them all at the end, since the brands we
 * lack artwork for are mostly the smallest ones.
 */
function interleave(brands: Brand[]): Brand[] {
  const withLogo = brands.filter((b) => brandLogo(b.name));
  const withoutLogo = brands.filter((b) => !brandLogo(b.name));
  if (!withoutLogo.length) return withLogo;

  const gap = (withLogo.length + 1) / (withoutLogo.length + 1);
  const queue = [...withoutLogo];
  const out: Brand[] = [];
  let next = gap;
  withLogo.forEach((brand, index) => {
    out.push(brand);
    if (queue.length && index + 1 >= next) {
      out.push(queue.shift()!);
      next += gap;
    }
  });
  return [...out, ...queue];
}

function BrandLink({ brand }: { brand: Brand }) {
  const logo = brandLogo(brand.name);
  return (
    <Link
      href={`/marketplace/brand/${brandSlug(brand.name)}`}
      className="brand-strip__item"
      title={brand.name}
    >
      <span className="brand-strip__box">
        {logo ? (
          <Image
            src={logo}
            alt={brand.name}
            width={260}
            height={LOGO_HEIGHT}
            loading="eager"
            style={{ maxHeight: `${brandLogoScale(brand.name) * 100}%` }}
          />
        ) : (
          <span className="brand-strip__name">{brand.name}</span>
        )}
      </span>
    </Link>
  );
}

export default function BrandStrip({ brands }: { brands: Brand[] }) {
  const ordered = interleave(brands);
  if (!ordered.length) return null;

  return (
    <section className="bg-white py-12 md:py-16" aria-labelledby="brand-strip-heading">
      <Container size="wide">
        <div className="home__head">
          <h2 id="brand-strip-heading">Shop by brand</h2>
          <Link href="/marketplace/brands">All brands</Link>
        </div>
      </Container>
      {/* The list is duplicated so the drift can loop seamlessly; the copy is
          hidden from screen readers and from keyboard focus. */}
      <div className="brand-strip__viewport">
        <div className="brand-strip__track">
          <ul className="brand-strip__row">
            {ordered.map((brand) => (
              <li key={brand.slug}>
                <BrandLink brand={brand} />
              </li>
            ))}
          </ul>
          <ul className="brand-strip__row" aria-hidden="true" inert>
            {ordered.map((brand) => (
              <li key={`${brand.slug}-repeat`}>
                <BrandLink brand={brand} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
