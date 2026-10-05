"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, Check, ChevronDown, Lightbulb } from "lucide-react";
import type { TimelineCategory } from "@/lib/types";
import type { CropRecommendation } from "@/lib/types";
import { cn } from "@/lib/cn";
import { DURATION, EASE_STANDARD } from "@/lib/motion";
import { SectionCard, SectionTitle, Badge } from "./ui";

const CATEGORY_META: Record<
  TimelineCategory,
  { label: string; tone: "moss" | "sage" | "harvest" | "terracotta" }
> = {
  sowing: { label: "Sowing", tone: "moss" },
  irrigation: { label: "Irrigation", tone: "sage" },
  fertilization: { label: "Fertilization", tone: "harvest" },
  harvest: { label: "Harvest", tone: "terracotta" },
};

export function GrowthTimeline({ crop }: { crop: CropRecommendation }) {
  const [openId, setOpenId] = useState<string | null>(
    crop.growthTimeline[0]?.id ?? null,
  );
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <SectionCard className="p-6">
      <SectionTitle
        icon={<CalendarCheck className="h-4 w-4" aria-hidden />}
        title="4-Stage Crop Calendar & Timeline"
        subtitle="Expand each stage for the task checklist and agronomist notes."
      />

      <div className="mt-5 space-y-3">
        {crop.growthTimeline.map((stage, index) => {
          const meta = CATEGORY_META[stage.category];
          const open = openId === stage.id;
          const doneCount = stage.tasks.filter(
            (t) => checked[`${stage.id}:${t}`],
          ).length;
          const allDone =
            stage.tasks.length > 0 && doneCount === stage.tasks.length;

          return (
            <div
              key={stage.id}
              className={cn(
                "overflow-hidden rounded-lg border transition-all duration-300",
                open
                  ? "border-moss/25 bg-moss-light/30 shadow-1"
                  : "border-border/30 bg-surface/50 hover:border-border/60",
              )}
            >
              <button
                type="button"
                onClick={() => toggle(stage.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3.5 px-5 py-4 text-left"
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                      allDone
                        ? "bg-moss text-canvas shadow-2"
                        : "bg-moss-light text-moss ring-1 ring-moss/15",
                    )}
                  >
                    {allDone ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  {index < crop.growthTimeline.length - 1 ? (
                    <span className="absolute left-1/2 top-12 h-3 w-px -translate-x-1/2 bg-border/40" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-sm font-semibold text-ink">
                      {stage.name}
                    </p>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-secondary">
                    {stage.days} days · {doneCount}/{stage.tasks.length} tasks
                    {allDone ? " · complete" : ""}
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={{ duration: DURATION.fast, ease: EASE_STANDARD }}
                  className="shrink-0 text-ink-muted"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      duration: DURATION.base,
                      ease: EASE_STANDARD,
                    }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/25 px-5 pb-5 pt-4">
                      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
                        Task checklist
                      </p>
                      <ul className="space-y-1.5">
                        {stage.tasks.map((task) => {
                          const key = `${stage.id}:${task}`;
                          const isChecked = !!checked[key];
                          return (
                            <li key={key}>
                              <label className="flex cursor-pointer items-start gap-2.5 rounded-sm px-2 py-1 hover:bg-surface/60">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    setChecked((prev) => ({
                                      ...prev,
                                      [key]: !prev[key],
                                    }))
                                  }
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-moss focus:ring-moss/30"
                                />
                                <span
                                  className={cn(
                                    "text-sm leading-snug text-ink",
                                    isChecked && "text-ink-muted line-through",
                                  )}
                                >
                                  {task}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="mt-4 flex items-start gap-2.5 rounded-md border border-harvest-200/40 bg-harvest-50/50 px-4 py-3">
                        <Lightbulb
                          className="mt-0.5 h-4 w-4 shrink-0 text-harvest-600"
                          aria-hidden
                        />
                        <p className="text-xs leading-relaxed text-ink">
                          <span className="font-semibold text-harvest-700">
                            Agronomist tip:{" "}
                          </span>
                          {stage.expertTip}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
