"use client";
import { type ReactNode, useEffect } from "react";
import type Lenis from "lenis";

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    /* Phase 7.5 — scroll-time glass downgrade (see globals.css). Any
       native scroll event (lenis drives the native scroll position, so
       its animation fires these too) arms the class; 150ms after the
       last event it drops and the full refraction lens returns. */
    const root = document.documentElement;
    let settleTimer: number | null = null;
    const onScroll = () => {
      root.classList.add("is-scrolling");
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        root.classList.remove("is-scrolling");
        settleTimer = null;
      }, 150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let generation = 0;
    let instance: Lenis | null = null;
    let frame: number | null = null;

    const stop = () => {
      generation++;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      instance?.destroy();
      instance = null;
    };

    const update = async () => {
      stop();
      if (disposed || preference.matches) return;
      const currentGeneration = generation;
      try {
        const LenisClass = (await import("lenis")).default;
        if (disposed || preference.matches || currentGeneration !== generation)
          return;
        instance = new LenisClass({
          duration: 1.5,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 2,
          infinite: false,
        });

        function raf(time: number) {
          if (disposed || !instance || currentGeneration !== generation) return;
          instance.raf(time);
          frame = requestAnimationFrame(raf);
        }
        frame = requestAnimationFrame(raf);
      } catch (e) {
        console.warn("Lenis not available:", e);
      }
    };

    void update();
    preference.addEventListener("change", update);

    return () => {
      disposed = true;
      preference.removeEventListener("change", update);
      stop();
      window.removeEventListener("scroll", onScroll);
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      root.classList.remove("is-scrolling");
    };
  }, []);

  return <>{children}</>;
}

export default SmoothScroll;
