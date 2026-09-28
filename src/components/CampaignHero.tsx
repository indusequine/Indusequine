"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isSlowConnection, useSlowConnection } from "@/lib/useSlowConnection";

export type Campaign = {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  /** Set on the first campaign so it is not lazy loaded behind the fold check. */
  priority?: boolean;
  actions: { label: string; href: string }[];
};

// Long enough to read a headline and the line under it and still reach a
// button, short enough that nobody waits on the next one.
const INTERVAL = 4000;

export default function CampaignHero({ campaigns }: { campaigns: Campaign[] }) {
  const [current, setCurrent] = useState(0);
  const [holding, setHolding] = useState(false);
  const [animate, setAnimate] = useState(false);
  // On a poor connection the campaign stops rotating and the other two
  // photographs are never fetched: three full-bleed images for one that can be
  // seen is the most expensive thing on the page.
  const slow = useSlowConnection();
  const root = useRef<HTMLElement>(null);

  // The campaigns behind the first one ship without a src, so the browser
  // cannot start fetching them from the markup. On a good connection they are
  // handed their src as soon as the page is interactive, which is seconds
  // before the first rotation, so nothing is different to look at. On a poor
  // one they are never fetched at all.
  useEffect(() => {
    if (isSlowConnection()) return;
    const waiting = root.current?.querySelectorAll<HTMLImageElement>("img[data-src]");
    waiting?.forEach((img) => {
      img.src = img.dataset.src!;
      delete img.dataset.src;
    });
  }, [slow]);
  const touchStart = useRef<number | null>(null);

  // Rotation is opt-in: it starts only once we know the reader has not asked
  // for reduced motion, which also keeps the first render identical on the
  // server and the client.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAnimate(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const go = useCallback(
    (next: number) => setCurrent((next + campaigns.length) % campaigns.length),
    [campaigns.length],
  );

  // Any move, by hand or on its own, restarts the full interval, so a campaign
  // someone just chose is not replaced a moment later.
  useEffect(() => {
    if (slow || !animate || holding || campaigns.length < 2) return;
    const timer = setTimeout(() => go(current + 1), INTERVAL);
    return () => clearTimeout(timer);
  }, [slow, animate, holding, current, campaigns.length, go]);

  if (!campaigns.length) return null;

  return (
    <section
      ref={root}
      className="campaign-hero"
      aria-roledescription="carousel"
      aria-label="Campaigns"
      onMouseEnter={() => setHolding(true)}
      onMouseLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={() => setHolding(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(current - 1);
        if (event.key === "ArrowRight") go(current + 1);
      }}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const travelled = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(travelled) > 45) go(current + (travelled < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      {campaigns.map((campaign, index) => {
        const showing = index === current;
        return (
          <div
            key={campaign.title}
            className={`campaign-hero__slide${showing ? " is-showing" : ""}`}
            aria-hidden={!showing}
            inert={!showing}
          >
            {/* Plain img, like the rest of the site: these are photographs we
                ship ourselves, and next/image would put them through Vercel's
                optimiser for nothing. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              {...(index === 0 ? { src: campaign.image } : { "data-src": campaign.image })}
              alt=""
              className="campaign-hero__media"
              fetchPriority={index === 0 ? "high" : "auto"}
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="campaign-hero__shade" />
            <div className="campaign-hero__copy">
              <p className="campaign-hero__eyebrow">{campaign.eyebrow}</p>
              <h1 className="campaign-hero__title">{campaign.title}</h1>
              <p className="campaign-hero__body">{campaign.body}</p>
              <div className="campaign-hero__actions">
                {campaign.actions.map((action) => (
                  <Link key={action.href} href={action.href} className="campaign-hero__button">
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {campaigns.length > 1 && !slow && (
        <div className="campaign-hero__dots" role="tablist" aria-label="Choose a campaign">
          {campaigns.map((campaign, index) => (
            <button
              key={campaign.title}
              type="button"
              role="tab"
              className="campaign-hero__dot"
              aria-current={index === current}
              aria-label={campaign.eyebrow}
              onClick={() => go(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
