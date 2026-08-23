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
    <div className="space-y-2.5">
      {[...recommendation.suitability.factors]
        .sort((a, b) => b.contribution - a.contribution)
        .map((f) => (
          <div key={f.key} title={f.reason}>
            <div className="flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-wider">
              <span className="font-bold">{f.label}</span>
              <span className={f.impact === "negative" ? "text-alarm" : f.impact === "positive" ? "text-ink" : "text-ink-soft"}>
                {f.score}/100 · {f.contribution.toFixed(1)}
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
        <p className="pt-1 font-mono text-[10px] uppercase text-alarm">
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
      className={`flex h-full flex-col border-2 border-ink bg-white ${
        featured ? "hard-shadow" : ""
      }`}
    >
      <header
        className={`flex items-center justify-between gap-2 border-b-2 border-ink px-4 py-1.5 ${
          featured ? "bg-acid" : ""
        }`}
      >
        <Badge variant={featured ? "neutral" : "source"}>{roleLabel[rec.role]}</Badge>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
          REC-{String(rec.rank).padStart(2, "0")}
        </span>
      </header>

      <div className="flex items-start justify-between gap-3 p-4 md:p-5">
        <h3
          className={`font-display uppercase leading-[0.95] ${
            featured ? "text-3xl md:text-5xl" : "text-2xl"
          }`}
        >
          {cropName(rec.cropId)}
        </h3>
        <div className="shrink-0 text-right">
          <p className={`font-display leading-none ${featured ? "text-6xl md:text-7xl" : "text-5xl"}`}>
            {rec.suitability.overallScore}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">
            /100 suitability
          </p>
        </div>
      </div>

      <div className="px-4 md:px-5">
        <ScoreBar value={rec.suitability.overallScore} tone={scoreTone(rec.suitability.overallScore)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 pt-3 md:px-5">
        <Badge variant={confidenceVariant[rec.confidence.level]}>
          CONF {rec.confidence.level} · {rec.confidence.score}
        </Badge>
        {econ && <DataSourceBadge valueClass={econ.valueClass === "estimated" ? "estimated" : "static"} />}
        {rec.warnings.length > 0 && <Badge variant="warning">{rec.warnings.length} warning(s)</Badge>}
      </div>

      {rec.confidence.reasons.length > 0 && (
        <ul className="space-y-0.5 px-4 pt-2 font-mono text-[10px] uppercase leading-relaxed text-ink-soft md:px-5">
          {rec.confidence.reasons.slice(0, 3).map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
      )}

      {econ && (
        <div className="mx-4 mt-4 border border-ink md:mx-5">
          <p className="border-b border-ink bg-paper-dim px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
            Expected economics / acre
          </p>
          <dl className="grid grid-cols-2 gap-y-0 p-2 font-mono text-[11px] leading-relaxed">
            <dt className="uppercase text-ink-soft">Net return</dt>
            <dd className="text-right font-bold">
              ₹{econ.netReturnPerAcreInr.min.toLocaleString("en-IN")}–₹{econ.netReturnPerAcreInr.max.toLocaleString("en-IN")}
            </dd>
            <dt className="uppercase text-ink-soft">Break-even</dt>
            <dd className="text-right">
              ₹{econ.breakEvenPricePerQuintalInr.min}–{econ.breakEvenPricePerQuintalInr.max}/qtl
            </dd>
            <dt className="uppercase text-ink-soft">ROI range</dt>
            <dd className="text-right">
              {econ.roiPercent.min}% – {econ.roiPercent.max}%
            </dd>
          </dl>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
        <div>
          <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-acid-deep">
            Why recommended
          </p>
          <ul className="space-y-1 text-sm leading-relaxed">
            {rec.whyRecommended.map((w) => (
              <li key={w} className="flex gap-2">
                <span aria-hidden className="font-bold text-acid-deep">+</span>
                {w}
              </li>
            ))}
          </ul>
        </div>

        {rec.whyRankedLower.length > 0 && (
          <div>
            <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-soft">
              Why ranked lower
            </p>
            <ul className="space-y-1 text-sm leading-relaxed text-ink-soft">
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
          <ul className="mt-auto space-y-1 border-l-8 border-caution bg-white py-1 pl-3 pr-2 font-mono text-[11px] uppercase leading-relaxed">
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
