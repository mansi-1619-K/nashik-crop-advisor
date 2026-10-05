"use client";

import { useSyncExternalStore } from "react";

/**
 * Live prefers-reduced-motion subscription (Phase 5.6 fix).
 *
 * motion@13's own `useReducedMotion()` is implemented as
 * `useState(prefersReducedMotion.current)` with no change listener, so it
 * only ever reports the value captured at mount — toggling the OS setting
 * mid-session never reaches the component (verified: click-spark kept
 * drawing sparks after a live switch to reduce). This hook honors the
 * full contract via useSyncExternalStore: authoritative client snapshot,
 * change events afterwards, false on the server (SSR/hydration-safe).
 */

const QUERY = "(prefers-reduced-motion: reduce)";

let cachedQuery: MediaQueryList | null = null;

function getQuery(): MediaQueryList {
  cachedQuery ??= window.matchMedia(QUERY);
  return cachedQuery;
}

function subscribe(onStoreChange: () => void): () => void {
  const query = getQuery();
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  return getQuery().matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotionLive(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
