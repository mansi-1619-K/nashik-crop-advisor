"use client";

import { Bug, CheckCircle2, Eye, ShieldAlert } from "lucide-react";
import type { CropRecommendation, RiskLevel } from "@/lib/types";
import { cn } from "@/lib/cn";
import { SectionCard, SectionTitle, Badge } from "./ui";
import { Progress } from "./ui/progress";

const RISK_TONE: Record<RiskLevel, { tone: "moss" | "sage" | "harvest" | "terracotta"; indicator: string; label: string; pct: number }> = {
  low: { tone: "moss", indicator: "[&_[data-slot=progress-indicator]]:bg-moss", label: "Low threat", pct: 25 },
  medium: { tone: "sage", indicator: "[&_[data-slot=progress-indicator]]:bg-sage", label: "Medium threat", pct: 50 },
  high: { tone: "harvest", indicator: "[&_[data-slot=progress-indicator]]:bg-harvest-500", label: "High threat", pct: 75 },
  critical: { tone: "terracotta", indicator: "[&_[data-slot=progress-indicator]]:bg-terracotta", label: "Critical threat", pct: 95 },
};

const TONE_BADGE = {
  moss: "moss",
  sage: "sage",
  harvest: "harvest",
  terracotta: "terracotta",
} as const;

export function PestDiseaseCard({ crop }: { crop: CropRecommendation }) {
  const risk = crop.pestAndDiseaseRisk;
  const meta = RISK_TONE[risk.riskLevel];

  return (
    <SectionCard className="p-6">
      <SectionTitle
        icon={<Bug className="h-4 w-4" aria-hidden />}
        title="Pest & Disease Intelligence"
        subtitle="Primary threats, prevention and symptom scouting."
        right={<Badge tone={TONE_BADGE[meta.tone]}>{meta.label}</Badge>}
      />

      <div className="mt-5 space-y-4">
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
            <span>Threat level</span>
            <span>{meta.label}</span>
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <Progress
              value={meta.pct}
              aria-label={`Threat level: ${meta.label}`}
              className={cn("h-2 flex-1 bg-border-light", meta.indicator)}
            />
            <ShieldAlert className="h-4 w-4 text-ink-muted" aria-hidden />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/30 bg-canvas-warm/40 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
              Primary pests
            </p>
            <ul className="mt-2 space-y-1.5">
              {risk.primaryPests.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border/30 bg-canvas-warm/40 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
              Primary diseases
            </p>
            <ul className="mt-2 space-y-1.5">
              {risk.primaryDiseases.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-harvest-500" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Preventative IPM practices
          </p>
          <ul className="space-y-1.5">
            {risk.ipmAdvice.map((advice) => (
              <li key={advice} className="flex items-start gap-2.5 text-sm leading-snug text-ink-secondary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-moss" aria-hidden />
                {advice}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Symptoms to watch for
          </p>
          <ul className="space-y-1.5">
            {risk.symptoms.map((s) => (
              <li key={s} className="flex items-start gap-2.5 text-sm leading-snug text-ink-secondary">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}
