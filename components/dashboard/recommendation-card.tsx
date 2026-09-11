"use client";

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
    <div className="space-y-3">
      {[...recommendation.suitability.factors]
        .sort((a, b) => b.contribution - a.contribution)
        .map((f) => (
          <div key={f.key} title={f.reason}>
            <div className="flex items-baseline justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.12em]">
              <span className="font-bold">{f.label}</span>
              <span className={f.impact === "negative" ? "text-alarm" : f.impact === "positive" ? "text-ink" : "text-ink-soft"}>
                {f.score}/100 · {f.contribution.toFixed(1)}
              </span>
            </div>
            <ScoreBar
              value={f.score}
              tone={f.impact === "positive" ? scoreTone(f.score) : f.impact === "negative" ? "red" : "amber"}
              className="mt-1.5"
            />
          </div>
        ))}
      {recommendation.suitability.riskPenalty > 0 && (
        <p className="pt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-alarm">
          −{recommendation.suitability.riskPenalty} disease-risk penalty applied
        </p>
      )}
    </div>
  );
}

export function RecommendationCard({
  rec,
  featured = false,
}: {
  rec: Recommendation;
  featured?: boolean;
}) {
  const econ = rec.economics;
  return (
    <article
      className={`flex h-full flex-col border bg-white transition-shadow duration-300 ${
        featured ? "border-ink shadow-[4px_4px_0_0_theme(--color-ink)]" : "border-line"
      }`}
    >
      <header
        className={`flex items-center justify-between gap-2 border-b px-5 py-2.5 ${
          featured ? "border-ink bg-ink text-paper" : "border-line"
        }`}
      >
        <Badge variant={featured ? "phase" : "source"}>{roleLabel[rec.role]}</Badge>
        <span className={`font-mono text-[9px] uppercase tracking-[0.15em] ${featured ? "text-paper/60" : "text-ink-soft"}`}>
          REC-{String(rec.rank).padStart(2, "0")}
        </span>
      </header>

      <div className="flex items-start justify-between gap-4 p-5 md:p-6">
        <h3
          className={`font-display font-light uppercase leading-[0.95] tracking-tight ${
            featured ? "text-3xl md:text-5xl" : "text-2xl"
          }`}
        >
          {cropName(rec.cropId)}
        </h3>
        <div className="shrink-0 text-right">
          <p className={`font-display font-light leading-none ${featured ? "text-6xl md:text-7xl" : "text-5xl"}`}>
            {rec.suitability.overallScore}
          </p>
          <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-ink-soft">
            /100 suitability
          </p>
        </div>
      </div>

      <div className="px-5 md:px-6">
        <ScoreBar value={rec.suitability.overallScore} tone={scoreTone(rec.suitability.overallScore)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pt-3 md:px-6">
        <Badge variant={confidenceVariant[rec.confidence.level]}>
          CONF {rec.confidence.level} · {rec.confidence.score}
        </Badge>
        {econ && <DataSourceBadge valueClass={econ.valueClass === "estimated" ? "estimated" : "static"} />}
        {rec.warnings.length > 0 && <Badge variant="warning">{rec.warnings.length} warning(s)</Badge>}
      </div>

      {rec.confidence.reasons.length > 0 && (
        <ul className="space-y-0.5 px-5 pt-2.5 font-mono text-[9px] uppercase leading-[1.7] tracking-[0.08em] text-ink-soft md:px-6">
          {rec.confidence.reasons.slice(0, 3).map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
      )}

      {econ && (
        <div className="mx-5 mt-4 border border-line md:mx-6">
          <p className="border-b border-line bg-paper-dim px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em]">
            Expected economics / acre
          </p>
          <dl className="grid grid-cols-2 gap-y-0 p-3 font-mono text-[10px] leading-[1.8]">
            <dt className="uppercase tracking-[0.08em] text-ink-soft">Net return</dt>
            <dd className="text-right font-bold">
              ₹{econ.netReturnPerAcreInr.min.toLocaleString("en-IN")}–₹{econ.netReturnPerAcreInr.max.toLocaleString("en-IN")}
            </dd>
            <dt className="uppercase tracking-[0.08em] text-ink-soft">Break-even</dt>
            <dd className="text-right">
              ₹{econ.breakEvenPricePerQuintalInr.min}–{econ.breakEvenPricePerQuintalInr.max}/qtl
            </dd>
            <dt className="uppercase tracking-[0.08em] text-ink-soft">ROI range</dt>
            <dd className="text-right">
              {econ.roiPercent.min}% – {econ.roiPercent.max}%
            </dd>
          </dl>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-5 p-5 md:p-6">
        <div>
          <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-vermilion">
            Why recommended
          </p>
          <ul className="space-y-1.5 text-sm leading-[1.6]">
            {rec.whyRecommended.map((w) => (
              <li key={w} className="flex gap-2">
                <span aria-hidden className="font-bold text-vermilion">+</span>
                {w}
              </li>
            ))}
          </ul>
        </div>

        {rec.whyRankedLower.length > 0 && (
          <div>
            <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink-soft">
              Why ranked lower
            </p>
            <ul className="space-y-1.5 text-sm leading-[1.6] text-ink-soft">
              {rec.whyRankedLower.slice(0, 3).map((w) => (
                <li key={w} className="flex gap-2">
                  <span aria-hidden className="font-bold">−</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {rec.warnings.length > 0 && (
          <ul className="mt-auto space-y-1 border-l-2 border-caution bg-paper-dim py-1.5 pl-4 pr-3 font-mono text-[10px] uppercase leading-[1.7] tracking-[0.08em]">
            {rec.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
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
