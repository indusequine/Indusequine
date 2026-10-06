"use client";

import Link from "next/link";
import { Container } from "@/components/Container";
import { brandSlug } from "@/lib/brands";
import { useSlowConnection } from "@/lib/useSlowConnection";
import { brandLogo, brandLogoScale } from "@/lib/brandLogos";
import type { Brand } from "@/data/products";

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

function BrandLink({ brand, prefetch }: { brand: Brand; prefetch?: false }) {
  const logo = brandLogo(brand.name);
  return (
    <Link
      href={`/marketplace/brand/${brandSlug(brand.name)}`}
      className="brand-strip__item"
      title={brand.name}
      prefetch={prefetch}
    >
      <span className="brand-strip__box">
        {logo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logo}
            alt={brand.name}
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

// Three lanes, not one. A single row fits two nameplates on a phone, which
// reads as an empty shelf rather than a catalogue of twenty-two brands.
// Alternating the direction makes the block feel alive at a glance and stops
// the three lanes drifting as one slab.
const LANES = 3;

export default function BrandStrip({ brands }: { brands: Brand[] }) {
  // Thirty-one logos, each its own request, and a duplicate row so the drift
  // can loop. On a poor connection the strip holds still and shows the twelve
  // busiest brands, which is one row and no second copy.
  const slow = useSlowConnection();
  const all = interleave(brands);
  const ordered = slow ? all.slice(0, 12) : all;
  if (!ordered.length) return null;

  // Dealt round-robin so each lane keeps the mix of logos and nameplates that
  // interleave() just worked out, rather than one lane taking all the logos.
  const lanes: Brand[][] = Array.from({ length: LANES }, () => []);
  ordered.forEach((brand, index) => lanes[index % LANES].push(brand));

  return (
    <section className="bg-white py-12 md:py-16" aria-labelledby="brand-strip-heading">
      <Container size="wide">
        <div className="home__head">
          <h2 id="brand-strip-heading">Shop by brand</h2>
          <Link href="/marketplace/brands">All brands</Link>
        </div>
      </Container>

      {slow ? (
        <div className="brand-strip__viewport is-still">
          <div className="brand-strip__track">
            <ul className="brand-strip__row">
              {ordered.map((brand) => (
                <li key={brand.slug}>
                  <BrandLink brand={brand} prefetch={false} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="brand-strip__lanes">
          {lanes.map((lane, index) =>
            lane.length ? (
              <div
                key={index}
                className="brand-strip__viewport"
                // Odd lanes run the other way; each lane takes its own time so
                // the three never line up into a single moving block.
                data-reverse={index % 2 === 1 ? "" : undefined}
                style={{ "--drift": `${86 + index * 13}s` } as React.CSSProperties}
              >
                <div className="brand-strip__track">
                  <ul className="brand-strip__row">
                    {lane.map((brand) => (
                      <li key={brand.slug}>
                        <BrandLink brand={brand} />
                      </li>
                    ))}
                  </ul>
                  {/* The copy that makes the loop seamless, kept from screen
                      readers and from keyboard focus. */}
                  <ul className="brand-strip__row" aria-hidden="true" inert>
                    {lane.map((brand) => (
                      <li key={`${brand.slug}-repeat`}>
                        <BrandLink brand={brand} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null,
          )}
        </div>
      )}
    </section>
  );
}
