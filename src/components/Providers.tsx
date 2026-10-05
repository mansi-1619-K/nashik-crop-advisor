"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SmoothScroll } from "@/components/block/smooth-scroll";
import { ClickSpark } from "@/components/block/click-spark";

/**
 * Client-side provider roots for ObsidianUI primitives:
 * - TooltipProvider — required once globally by Radix tooltip.
 * - Toaster — sonner toast surface (used by Phase 5.2 actions).
 * - SmoothScroll — lenis wheel smoothing (plan 5.6); self-disables under
 *   prefers-reduced-motion. Lenis writes its per-frame position with
 *   behavior:"instant", so it doesn't fight html's CSS scroll-behavior.
 * - ClickSpark — harvest burst on click/tap (plan 5.6). sparkColor is
 *   passed explicitly: no ThemeProvider mounts in this app, so next-themes'
 *   useTheme would resolve nothing and fall back to #000 (invisible on
 *   the paper canvas) — and the light-theme gold needs the deeper
 *   harvest shade to stay visible on cream.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={200}>
      <SmoothScroll>{children}</SmoothScroll>
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "rounded-lg border border-border bg-surface text-ink shadow-2",
          },
        }}
      />
      <ClickSpark sparkColor="#a97420" />
    </TooltipProvider>
  );
}
