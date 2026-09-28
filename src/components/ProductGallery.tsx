"use client";

import { useState } from "react";
import { shopifyImage } from "@/lib/imageUrl";

// The detail image sits at ~700px and the thumbnails at ~90px, both doubled
// for 2x screens, matching how ProductImage sizes its own request.
const MAIN = 1400;
const THUMB = 180;

type ProductGalleryProps = {
  images: string[];
  name: string;
};

/**
 * The photographs of one product, with the rest of them under the main shot.
 *
 * Suppliers who send their own photography send several angles per product,
 * and until now only the featured one was ever shown. Piquant send a front and
 * a back of every colourway, so a shirt arrives with fifteen.
 *
 * Products with a single photograph keep the plain ProductImage, so nothing
 * changes for the rest of the catalogue.
 */
export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [shown, setShown] = useState(0);
  const current = images[shown] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden bg-cream-warm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shopifyImage(current, MAIN)}
          alt={name}
          className="w-full h-full object-cover"
          decoding="async"
        />
      </div>

      <ul className="grid grid-cols-6 gap-2 sm:grid-cols-8" role="list">
        {images.map((url, index) => (
          <li key={url}>
            <button
              type="button"
              onClick={() => setShown(index)}
              aria-label={`${name}, photograph ${index + 1} of ${images.length}`}
              aria-current={index === shown}
              className={
                index === shown
                  ? "block w-full aspect-square overflow-hidden bg-cream-warm ring-1 ring-forest"
                  : "block w-full aspect-square overflow-hidden bg-cream-warm ring-1 ring-transparent hover:ring-forest/30 transition-shadow"
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shopifyImage(url, THUMB)}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
