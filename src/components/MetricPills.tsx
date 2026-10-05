"use client";

import {
  CalendarRange,
  Clock3,
  Droplets,
  Flower2,
  Scale,
} from "lucide-react";
import type { ComponentType } from "react";
import type { CropRecommendation } from "@/lib/types";
import { cn } from "@/lib/cn";

const PILLS: {
  key: "sowingWindow" | "duration" | "expectedYield" | "companion" | "waterRequirement";
  label: string;
  icon: ComponentType<{ className?: string }>;
  short: boolean;
}[] = [
  { key: "sowingWindow", label: "Sowing Window", icon: CalendarRange, short: false },
  { key: "duration", label: "Duration", icon: Clock3, short: true },
  { key: "expectedYield", label: "Expected Yield", icon: Scale, short: false },
  { key: "companion", label: "Companion", icon: Flower2, short: false },
  { key: "waterRequirement", label: "Water Level", icon: Droplets, short: false },
];

export function MetricPills({ crop }: { crop: CropRecommendation }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
      {PILLS.map((pill) => {
        const Icon = pill.icon;
        const value = crop[pill.key];
        return (
          <div
            key={pill.key}
            className={cn(
              "rounded-lg border border-border/40 bg-surface/60 p-3.5 transition-all duration-300 hover:border-moss/15 hover:bg-moss-light/20",
              pill.short && "col-span-1",
            )}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
              <Icon className="h-3.5 w-3.5 text-moss" aria-hidden />
              {pill.label}
            </p>
            <p
              className={cn(
                "mt-1.5 text-sm font-semibold text-ink",
                pill.key === "duration" && "text-base",
              )}
            >
              {pill.key === "duration" ? `${value} days` : value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
