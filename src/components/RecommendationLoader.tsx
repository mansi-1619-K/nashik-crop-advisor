"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/cn";
import { DURATION, EASE_STANDARD } from "@/lib/motion";
import { Progress } from "./ui/progress";
import { Spinner } from "./ui/spinner";

/**
 * Staged loading experience for the recommendation call. A Gemini round
 * trip can take ~15s, so instead of a dead skeleton we walk the user
 * through what the engine is doing: stages advance on a timer, the
 * progress bar eases toward each stage's target, and the copy crossfades.
 * Completion is signalled by the parent unmounting this component.
 */
const STAGES = [
  {
    label: "Reading field parameters",
    detail: "Region, season, soil and water availability",
    target: 15,
  },
  {
    label: "Fetching microclimate forecast",
    detail: "7-day Open-Meteo outlook for your plot",
    target: 35,
  },
  {
    label: "Running Gemini agronomy engine",
    detail: "Cross-checking crop models — this can take ~15s",
    target: 68,
  },
  {
    label: "Ranking crop suitability",
    detail: "Scoring yield, market, water and soil fit",
    target: 92,
  },
] as const;

const STAGE_INTERVAL_MS = 3500;

export function RecommendationLoader() {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((s) => {
        const next = Math.min(s + 1, STAGES.length - 1);
        setProgress(STAGES[next].target);
        return next;
      });
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const current = STAGES[stage];

  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="rounded-lg border border-moss/15 bg-moss-light/30 p-5">
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5 text-moss" />
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: DURATION.fast, ease: EASE_STANDARD }}
              >
                <p className="text-sm font-semibold text-ink">
                  {current.label}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {current.detail}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
          <span
            className="font-display text-h3 font-semibold tabular-nums text-moss-deep"
            aria-hidden
          >
            {progress}%
          </span>
        </div>
        <Progress
          value={progress}
          className="mt-4 h-1.5 bg-canvas-deep"
          aria-label="Recommendation progress"
        />
        <div className="mt-2.5 flex gap-1.5" aria-hidden>
          {STAGES.map((s, i) => (
            <span
              key={s.label}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                i < stage
                  ? "bg-moss/60"
                  : i === stage
                    ? "bg-moss"
                    : "bg-canvas-deep",
              )}
            />
          ))}
        </div>
      </div>

      {/* Layout skeletons keep the page geometry stable while loading. */}
      <div className="space-y-6">
        <div className="flex gap-2.5">
          <div className="h-12 w-56 animate-pulse rounded-lg bg-surface" />
          <div className="h-12 w-56 animate-pulse rounded-lg bg-surface" />
          <div className="hidden h-12 w-56 animate-pulse rounded-lg bg-surface lg:block" />
        </div>
        <div className="h-28 w-full animate-pulse rounded-lg bg-surface" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="h-64 w-full animate-pulse rounded-lg bg-surface" />
          <div className="h-64 w-full animate-pulse rounded-lg bg-surface" />
        </div>
      </div>
    </div>
  );
}
