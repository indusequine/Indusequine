"use client";

import { useSyncExternalStore } from "react";

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function connection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

/**
 * True when the browser reports a slow connection, or the reader has asked
 * their device to save data.
 *
 * Read through useSyncExternalStore rather than an effect, so the server and
 * the first client render agree: both start at false. A reader on a good
 * connection therefore gets exactly what they got before, with no flicker
 * while we work out what their network is doing.
 *
 * Chrome and the Android browsers report this; Safari and Firefox do not, and
 * there they read as fast. That is the right way round: a missing answer
 * should not degrade a page for someone whose connection is fine.
 */
export function useSlowConnection(): boolean {
  return useSyncExternalStore(subscribe, isSlow, () => false);
}

/**
 * The same answer, read on the spot.
 *
 * Hydration renders once with the server's answer, which is always "fast", so
 * an effect reading the hook's value in that first pass acts on it before the
 * real one arrives. Anything that fetches has to ask here instead.
 */
export function isSlowConnection(): boolean {
  return typeof navigator === "undefined" ? false : isSlow();
}

function subscribe(onChange: () => void): () => void {
  const network = connection();
  network?.addEventListener?.("change", onChange);
  return () => network?.removeEventListener?.("change", onChange);
}

function isSlow(): boolean {
  const network = connection();
  if (!network) return false;
  if (network.saveData) return true;
  return network.effectiveType === "slow-2g"
    || network.effectiveType === "2g"
    || network.effectiveType === "3g";
}
