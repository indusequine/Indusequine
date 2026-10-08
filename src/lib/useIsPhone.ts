"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 767px)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * True on a phone-width screen.
 *
 * Read through useSyncExternalStore so the server and the first client render
 * agree, and the server snapshot is false: a desktop therefore renders exactly
 * what it rendered before, and the phone adjusts on the first paint after
 * hydration. That way round because this exists to stop a change meant for a
 * phone reaching a laptop, which is the mistake it was written to undo.
 */
export function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
