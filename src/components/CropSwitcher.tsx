"use client";

import { motion } from "motion/react";
import { Award, Leaf, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";
import type { CropRecommendation, CropTier } from "@/lib/types";
import { cn } from "@/lib/cn";
import { TabsList, TabsTrigger } from "./ui/tabs";

const TIER_META: Record<
  CropTier,
  { label: string; icon: ComponentType<{ className?: string }> }
> = {
  primary: { label: "Primary", icon: Award },
  secondary: { label: "Secondary", icon: Leaf },
  alternative: { label: "Alternative", icon: ShieldCheck },
};

/**
 * Tab list for switching the active crop tier. Renders inside the Radix
 * `Tabs` root hosted by Dashboard (which owns value/onValueChange), so we
 * get real tab semantics: arrow-key roving focus, aria-selected and
 * automatic activation. `activeTier` only drives the clay indicator /
 * icon color — selection state itself lives in Tabs.
 */
export function CropSwitcher({
  crops,
  activeTier,
}: {
  crops: CropRecommendation[];
  activeTier: CropTier;
}) {
  return (
    <TabsList className="flex h-auto w-full flex-wrap gap-2.5 bg-transparent p-0">
      {crops.map((crop) => {
        const meta = TIER_META[crop.tier];
        const Icon = meta.icon;
        const active = crop.tier === activeTier;
        return (
          <TabsTrigger
            key={crop.id}
            value={crop.tier}
            className={cn(
              "relative h-auto min-w-0 flex-none justify-start gap-2.5 whitespace-normal rounded-lg border px-4 py-3 text-left text-sm transition-all duration-300",
              active
                ? "border-moss/40 bg-moss text-canvas shadow-2"
                : "border-border/40 bg-surface/60 text-ink-secondary hover:border-moss/20 hover:bg-moss-light/30",
              "data-[state=active]:border-moss/40 data-[state=active]:bg-moss data-[state=active]:text-canvas",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                active ? "text-canvas/90" : "text-moss",
              )}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight">
                {crop.crop}
              </span>
              <span
                className={cn(
                  "block text-[11px] leading-tight",
                  active ? "text-canvas/70" : "text-ink-muted",
                )}
              >
                {meta.label}
              </span>
            </span>
            {active ? (
              <motion.span
                layoutId="crop-tab-indicator"
                className="absolute -bottom-px left-4 right-4 h-0.5 rounded-full bg-clay"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            ) : null}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
