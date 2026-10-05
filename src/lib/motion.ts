/**
 * Motion tokens (plan 6.1) — single source of truth for JS-side motion.
 *
 * `EASE_STANDARD` is the workhorse curve used across component
 * transitions (framer tuple form of the CSS
 * `cubic-bezier(0.25, 0.46, 0.45, 0.94)`); the CSS twin lives in
 * globals.css `:root` (`--ease-standard`, `--duration-*`) for
 * stylesheet consumers — keep the numbers in sync when evolving the
 * scale. Durations are seconds (framer's unit); CSS twins carry the
 * `s` suffix (`--duration-fast: 0.25s`).
 *
 * Deliberately out of scope:
 * - GSAP named eases in `hover-img` (registry blocks keep their native
 *   vocabulary — "power3.out" is GSAP's token, not a raw literal)
 * - lenis scroll `duration` in `smooth-scroll` (smoothing window,
 *   not UI motion)
 * - sonner toast `duration`s (content lifetime, not animation)
 */

/** Workhorse ease — easeOutQuad-family curve (plan 6.1). */
export const EASE_STANDARD: [number, number, number, number] = [
  0.25, 0.46, 0.45, 0.94,
];

/** Shared duration scale, in seconds (framer's unit). */
export const DURATION = {
  /** Snappy — list reveals, tab fades. */
  fast: 0.25,
  /** Default — content swaps. */
  base: 0.3,
  /** Relaxed — heavier card entrances. */
  slow: 0.35,
  /** Emphasis — staged hero/card reveals. */
  emphasis: 0.5,
} as const;
