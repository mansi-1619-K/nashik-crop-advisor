"use client";

import type { ReactNode } from "react";
import { Glass } from "@samasante/liquid-glass";
import { cn } from "@/lib/cn";
import { GLASS_CHROME, GLASS_SURFACE } from "@/lib/glass";

/**
 * GlassChip — the small pill shell (plan 4.3 / 4.4): preset buttons,
 * badges. Locked `chrome` optics; compact enough that even the 512px map
 * is cheap, and only a handful mount at once.
 *
 * Print: suppressed via `.glass-surface` rules in globals.css.
 */
export function GlassChip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Glass
      optics={GLASS_CHROME}
      /* No `style` override here on purpose: material mode's inline
         `display:inline-block` shrink-wrap is exactly right for a pill —
         the action-bar pill wraps its buttons, and preset chips are grid
         children anyway (grid blockifies inline-block). */
      className={cn(
        GLASS_SURFACE,
        "rounded-full border border-border/50 bg-surface/35 shadow-1",
        className,
      )}
    >
      {children}
    </Glass>
  );
}
