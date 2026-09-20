"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/Logo";

// Never flash: below this the curtain reads as a glitch rather than an intro.
const MIN_MS = 1400;
// Hard ceiling. A slow connection must never hold someone out longer than this.
// The CSS failsafe is set to outlast it, so in the normal case the script wins
// and the failsafe never gets to finish.
const MAX_MS = 2600;

export function IntroCurtain() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Time from navigation, not from hydration. On a slow connection the bundle
    // can arrive seconds in, and measuring from here would restart the clock and
    // hold the curtain up for the sum of the two.
    if (performance.now() >= MAX_MS) {
      // The CSS failsafe is already seeing the curtain out. Taking the animation
      // off now would snap it back to fully opaque mid-fade, so leave it alone
      // entirely -- no state change, CSS keeps control.
      return;
    }

    const bar = el.querySelector<HTMLElement>(".intro-curtain-bar");
    // Hand both elements over from CSS to the script. An animation beats an
    // inline style, so the inline transform below would not apply otherwise.
    el.style.animation = "none";
    if (bar) bar.style.animation = "none";

    let loaded = document.readyState === "complete";
    const onLoad = () => {
      loaded = true;
    };
    if (!loaded) window.addEventListener("load", onLoad);

    let raf = 0;
    const tick = () => {
      const elapsed = performance.now();

      // Real signal where there is one: how many of the images the page has
      // actually requested have finished. Lazy images further down are not
      // counted -- they have not been asked for yet, and waiting on them would
      // mean waiting forever.
      const imgs = Array.from(document.images).filter(
        (i) => i.loading !== "lazy" || i.complete,
      );
      const ratio = imgs.length ? imgs.filter((i) => i.complete).length / imgs.length : 0;

      if ((loaded && elapsed >= MIN_MS) || elapsed >= MAX_MS) {
        setProgress(1);
        setDone(true);
        return;
      }
      // Whichever is further along, so the bar keeps moving when images are not
      // the bottleneck and tracks them when they are.
      setProgress(Math.min(Math.max(elapsed / MAX_MS, ratio), 0.97));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`intro-curtain${done ? " intro-curtain-done" : ""}`}
    >
      <div className="intro-curtain-inner">
        <LogoMark size={56} />
        <div className="intro-curtain-track">
          <div
            className="intro-curtain-bar"
            style={progress ? { transform: `scaleX(${progress})` } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
