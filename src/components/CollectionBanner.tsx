"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { shopifyImage } from "@/lib/imageUrl";

export type BannerItem = {
  eyebrow: string;
  title: string;
  href: string;
  image: string;
  alt: string;
};

// Slower than the campaign hero, which a reader has usually left by the time
// this one is on screen. Long enough to take in a product and read its brand.
const INTERVAL = 5000;

/** A shuffle that is done once, on the client, after the server's markup has
 *  been matched. Shuffling during render would give the server one order and
 *  the browser another, and React would throw the markup away. */
function shuffled<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function CollectionBanner({ items }: { items: BannerItem[] }) {
  // The first product is the server's, so the markup matches on arrival. The
  // order is shuffled on the first move, which is where every visit diverges.
  const [order, setOrder] = useState(items);
  const [current, setCurrent] = useState(0);
  const [holding, setHolding] = useState(false);
  const shuffledOnce = useRef(false);

  useEffect(() => {
    if (holding || order.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setTimeout(() => {
      if (shuffledOnce.current) {
        setCurrent((n) => (n + 1) % order.length);
        return;
      }
      shuffledOnce.current = true;
      // Keep the one on screen where it is and shuffle the rest behind it, so
      // the move itself is the first the reader sees, not a jump.
      const showing = order[current];
      const rest = shuffled(order.filter((item) => item !== showing));
      setOrder([showing, ...rest]);
      setCurrent(1);
    }, INTERVAL);

    return () => clearTimeout(timer);
  }, [holding, current, order]);

  if (!order.length) return null;

  return (
    <div
      className="bento__tile bento__tile--cover"
      onMouseEnter={() => setHolding(true)}
      onMouseLeave={() => setHolding(false)}
    >
      {order.map((item, index) => (
        <Link
          key={item.href + item.alt}
          href={item.href}
          className={`bento__rotator${index === current ? " is-showing" : ""}`}
          aria-hidden={index !== current}
          inert={index !== current}
        >
          <span className="bento__shot bento__shot--cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shopifyImage(item.image, 1200)}
              alt={item.alt}
              loading={index === 0 ? "eager" : "lazy"}
            />
          </span>
          <span className="bento__caption bento__caption--dark">
            <small>{item.eyebrow}</small>
            {item.title}
          </span>
        </Link>
      ))}
    </div>
  );
}
