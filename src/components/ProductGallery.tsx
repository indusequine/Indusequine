"use client";

import { useEffect, useRef, useState } from "react";
import { shopifyImage } from "@/lib/imageUrl";
import { useProductSelection } from "@/components/ProductSelection";

// The detail image sits at ~700px and the thumbnails at ~90px, both doubled
// for 2x screens, matching how ProductImage sizes its own request.
const MAIN = 1400;
const THUMB = 180;

// Dots stop reading as a count somewhere past here, and the catalogue agrees:
// of the 167 products with more than one photograph the median is three and
// only twelve carry more than eight. Those twelve get a tally instead.
const DOTS_MAX = 8;

type ProductGalleryProps = {
  images: string[];
  name: string;
  /** Colour -> that colour's own photograph, read off the pinned variants. */
  imagesByColor?: Record<string, string>;
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
export function ProductGallery({ images, name, imagesByColor }: ProductGalleryProps) {
  const selection = useProductSelection();
  const picked = selection?.color ?? null;

  // Which shot belongs to the picked colour, if any.
  const forColour = picked && imagesByColor?.[picked] ? images.indexOf(imagesByColor[picked]) : -1;

  // What the rider last clicked, and the colour that was showing when they did.
  // Picking a new colour clears the click, so the gallery follows the picker
  // again; browsing the thumbnails afterwards still wins until they do.
  const [clicked, setClicked] = useState<number | null>(null);
  const [colourShown, setColourShown] = useState<string | null>(picked);
  if (picked !== colourShown) {
    setColourShown(picked);
    setClicked(null);
  }

  const shown = clicked ?? (forColour >= 0 ? forColour : 0);

  // The shots sit in a row that scrolls, so a thumb can drag between them.
  // Tapping a thumbnail or picking a colour scrolls the row to match, and
  // dragging the row sets the same state back, which is what keeps the
  // thumbnail ring under the photograph actually being looked at.
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const target = shown * el.clientWidth;
    if (Math.abs(el.scrollLeft - target) < 2) return;
    el.scrollTo({ left: target, behavior: "smooth" });
  }, [shown]);

  // Read the index back only once the row has stopped moving. A smooth scroll
  // fires this the whole way across, so reading it live would catch slide 2 on
  // the way to slide 5, set that, and send the row back - the animation
  // fighting the state that started it. Waiting for the rest means a tap lands
  // where it was aimed and a swipe lands where it settled.
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onScroll = () => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const el = track.current;
      if (!el || !el.clientWidth) return;
      const index = Math.round(el.scrollLeft / el.clientWidth);
      if (index !== shown && index >= 0 && index < images.length) setClicked(index);
    }, 120);
  };
  useEffect(() => () => {
    if (settle.current) clearTimeout(settle.current);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={track}
        onScroll={onScroll}
        className="gallery-track flex overflow-x-auto snap-x snap-mandatory bg-cream-warm"
        aria-label={`${name}, ${images.length} photographs`}
      >
        {images.map((url, index) => (
          <div key={url} className="flex-none w-full snap-center aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shopifyImage(url, MAIN)}
              // The thumbnails carried these labels and are hidden on a phone,
              // so each shot has to say which one it is itself.
              alt={index === 0 ? name : `${name}, photograph ${index + 1} of ${images.length}`}
              className="w-full h-full object-cover"
              decoding="async"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {/* On a phone the row above is swiped, so a grid of 90px squares under it
          is work nobody needs to do: the dots say how many there are and which
          one this is, and that is all a thumbnail was being asked for. Past
          eight they stop reading as a count and a tally is plainer. */}
      <div className="flex items-center justify-center gap-2 md:hidden" aria-hidden="true">
        {images.length <= DOTS_MAX ? (
          images.map((url, index) => (
            <span
              key={url}
              className={
                index === shown
                  ? "h-1.5 w-5 rounded-full bg-forest transition-all"
                  : "h-1.5 w-1.5 rounded-full bg-forest/25 transition-all"
              }
            />
          ))
        ) : (
          <span className="font-mono text-xs text-stone tabular-nums">
            {shown + 1} / {images.length}
          </span>
        )}
      </div>

      <ul className="hidden md:grid grid-cols-6 gap-2 sm:grid-cols-8" role="list">
        {images.map((url, index) => (
          <li key={url}>
            <button
              type="button"
              onClick={() => setClicked(index)}
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
