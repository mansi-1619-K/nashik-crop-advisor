"use client";

import { AlertTriangle, CircleHelp, TrendingUp } from "lucide-react";
import { Badge, DataSourceBadge } from "@/components/ui/badge";
import { ScoreBar, scoreTone } from "@/components/ui/bar";
import type { Recommendation } from "@/lib/agriculture/results";

const confidenceVariant = { high: "success", medium: "warning", low: "danger" } as const;
const roleLabel: Record<Recommendation["role"], string> = {
  primary: "Top Recommendation",
  secondary: "Alternative",
  "resilient-alternative": "Climate-Resilient Alternative",
};

export function FactorBars({ recommendation }: { recommendation: Recommendation }) {
  return (
    <div className="space-y-2">
      {[...recommendation.suitability.factors]
        .sort((a, b) => b.contribution - a.contribution)
        .map((f) => (
          <div key={f.key} title={f.reason}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-zinc-700">{f.label}</span>
              <span className={f.impact === "negative" ? "text-red-600" : f.impact === "positive" ? "text-emerald-700" : "text-zinc-500"}>
                {f.score}/100 · contributes {f.contribution.toFixed(1)}
              </span>
            </div>
            <ScoreBar
              value={f.score}
              tone={f.impact === "positive" ? scoreTone(f.score) : f.impact === "negative" ? "red" : "amber"}
              className="mt-1"
            />
          </div>
        ))}
      {recommendation.suitability.riskPenalty > 0 && (
        <p className="pt-1 text-xs text-red-600">
          Disease-risk penalty applied: −{recommendation.suitability.riskPenalty} points
        </p>
      )}
    </div>
  );
}

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const econ = rec.economics;
  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Badge variant={rec.role === "primary" ? "success" : "neutral"}>{roleLabel[rec.role]}</Badge>
          <h3 className="mt-1.5 text-lg font-semibold text-zinc-900">#{rec.rank} · {cropName(rec.cropId)}</h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-zinc-900">{rec.suitability.overallScore}</p>
          <p className="text-[11px] uppercase tracking-wide text-zinc-400">suitability</p>
        </div>
      </div>

      <ScoreBar value={rec.suitability.overallScore} tone={scoreTone(rec.suitability.overallScore)} />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={confidenceVariant[rec.confidence.level]}>
          Confidence: {rec.confidence.level} ({rec.confidence.score})
        </Badge>
        {econ && <DataSourceBadge valueClass={econ.valueClass === "estimated" ? "estimated" : "static"} />}
        {rec.warnings.length > 0 && <Badge variant="warning">{rec.warnings.length} warning(s)</Badge>}
      </div>

      <ul className="space-y-1 text-xs text-zinc-500">
        {rec.confidence.reasons.slice(0, 3).map((r) => (
          <li key={r}>· {r}</li>
        ))}
      </ul>

      {econ && (
        <div className="rounded-lg bg-zinc-50 p-3 text-sm">
          <p className="mb-1 flex items-center gap-1.5 font-medium text-zinc-800">
            <TrendingUp size={14} aria-hidden /> Expected economics (per acre)
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-zinc-600">
            <span>Net return</span>
            <span className="text-right font-semibold text-zinc-900">
              ₹{econ.netReturnPerAcreInr.min.toLocaleString("en-IN")} – ₹{econ.netReturnPerAcreInr.max.toLocaleString("en-IN")}
            </span>
            <span>Break-even price</span>
            <span className="text-right">₹{econ.breakEvenPricePerQuintalInr.min}–{econ.breakEvenPricePerQuintalInr.max}/qtl</span>
            <span>ROI range</span>
            <span className="text-right">{econ.roiPercent.min}% – {econ.roiPercent.max}%</span>
          </div>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">Why recommended</p>
        <ul className="space-y-1 text-sm text-zinc-700">
          {rec.whyRecommended.map((w) => (
            <li key={w} className="flex gap-1.5"><span aria-hidden>✓</span>{w}</li>
          ))}
        </ul>
      </div>

      {rec.whyRankedLower.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <CircleHelp size={13} aria-hidden /> Why ranked lower
          </p>
          <ul className="space-y-1 text-sm text-zinc-600">
            {rec.whyRankedLower.slice(0, 3).map((w) => (
              <li key={w}>· {w}</li>
            ))}
          </ul>
        </div>
      )}

      {rec.warnings.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {rec.warnings.map((w) => (
            <li key={w} className="flex gap-1.5">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden />{w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const CROP_NAMES: Record<string, string> = {
  paddy: "Paddy (Rice)",
  "finger-millet": "Finger Millet",
  "little-millet": "Little Millet",
  grape: "Table Grape",
  onion: "Onion",
  tomato: "Tomato",
  pomegranate: "Pomegranate",
  guava: "Guava",
  "pearl-millet": "Pearl Millet",
  soybean: "Soybean",
  "pigeon-pea": "Pigeon Pea",
};

export function cropName(id: string): string {
  return CROP_NAMES[id] ?? id;
}
