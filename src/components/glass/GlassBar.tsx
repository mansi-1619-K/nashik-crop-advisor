"use client";

import type { ReactNode } from "react";
import { Glass } from "@samasante/liquid-glass";
import { cn } from "@/lib/cn";
import { GLASS_BAR, GLASS_HEADER, GLASS_SURFACE } from "@/lib/glass";

/**
 * GlassBar — the sticky chrome shell (plan 4.3 / 4.4): header, floating
 * action bars. Uses `GLASS_HEADER` (Phase 7.6) — the maxed-out refraction
 * pane: thick depth, hard meniscus, real chromatic dispersion, and a
 * lighter veil than before so the lens (not the tint) carries the
 * material read. This is the site's hero glass surface.
 *
 * Print: suppressed via `.glass-surface` rules in globals.css (the header
 * itself also carries `print-hide`).
 */
export function GlassBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Glass
      optics={GLASS_HEADER}
      /* See GlassChip — drop the inline inline-block default so the bar
         lays out as a normal block (full width of its sticky wrapper). */
      style={{ display: undefined }}
      className={cn(
        GLASS_SURFACE,
        GLASS_BAR,
        "border border-border/50 bg-canvas/30 shadow-1",
        className,
      )}
    >
      {children}
    </Glass>
  );
}
