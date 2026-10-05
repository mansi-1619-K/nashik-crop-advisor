"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Crop, FlaskConical, Wheat, Wine } from "lucide-react";
import type { ComponentType } from "react";
import type { RecommendationRequest } from "@/lib/types";
import { PRESETS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { GlassChip } from "./glass/GlassChip";

const PRESET_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "igatpuri-paddy": Wheat,
  "niphad-grapes-onion": Wine,
  "malegaon-bajra-pomegranate": Crop,
  "sinnar-summer-pulses": FlaskConical,
};

export function PresetButtons({
  params,
  onApply,
}: {
  params: RecommendationRequest;
  onApply: (next: RecommendationRequest) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-secondary">
        One-click sample presets
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((preset) => {
          const Icon = PRESET_ICONS[preset.id] ?? Crop;
          const active =
            params.region === preset.region &&
            params.season === preset.season &&
            params.soil === preset.soil &&
            params.water === preset.water;
          return (
            /* Chip shell carries the glass material + active/hover state
               (plan 4.4) — `:hover` on the chip still fires while the
               pointer is over the button inside it. */
            <GlassChip
              key={preset.id}
              className={cn(
                "h-full rounded-lg transition-colors duration-300 motion-reduce:transition-none",
                active
                  ? "border-moss/40 bg-moss-light/70 shadow-glow"
                  : "border-border/50 bg-surface/70 hover:border-moss/25 hover:bg-moss-light/40",
              )}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  onApply({
                    region: preset.region,
                    season: preset.season,
                    soil: preset.soil,
                    water: preset.water,
                  })
                }
                className="group flex h-full w-full flex-col p-4 text-left transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-sm transition-all duration-300",
                      active
                        ? "bg-moss text-canvas shadow-2"
                        : "bg-moss-light text-moss ring-1 ring-moss/10",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <ArrowUpRight
                    className={cn(
                      "h-3.5 w-3.5 text-border transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-moss",
                      active && "text-moss",
                    )}
                    aria-hidden
                  />
                </div>
                <span
                  className={cn(
                    "mt-3 block text-sm font-semibold leading-tight",
                    active ? "text-moss-deep" : "text-ink",
                  )}
                >
                  {preset.label}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-ink-secondary">
                  {preset.description}
                </span>
              </motion.button>
            </GlassChip>
          );
        })}
      </div>
    </div>
  );
}
