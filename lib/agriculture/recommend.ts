import type {
  ConstraintMessage,
  Recommendation,
  RecommendationOutput,
} from "./results";
import { farmerContextSchema, type FarmerContext } from "./context";
import { evaluateConstraints } from "./constraints";
import { scoreCrop } from "./suitability";
import { assessConfidence } from "./confidence";
import { estimateEconomicsFromCrop } from "./economics";
import {
  findSeason,
  findSoil,
  findZone,
  getAgricultureDatasets,
} from "./datasets";
import type { SuitabilityWeights } from "./weights";
import { DEFAULT_SUITABILITY_WEIGHTS } from "./weights";
import type { MarketDataset } from "@/lib/market/types";
import { marketDatasetSchema } from "@/lib/market/types";
import { loadDataset } from "@/lib/utils/datasetLoader";

export const ENGINE_VERSION = "1.0.0";

interface ScoredCandidate {
  cropId: string;
  cropName: string;
  overallScore: number;
  resilienceScore: number;
  warnings: string[];
  recommendation: Recommendation;
}

function contextSummary(context: FarmerContext): string {
  const datasets = getAgricultureDatasets();
  const zone = findZone(datasets, context.zoneId);
  const season = findSeason(datasets, context.seasonId);
  const soil = findSoil(datasets, context.soilId);
  return [
    zone?.name ?? context.zoneId,
    season?.name ?? context.seasonId,
    `${soil?.name ?? context.soilId} soil`,
    `water: ${context.waterAvailability}`,
  ].join(" · ");
}

export function generateRecommendations(
  rawContext: unknown,
  options: { weights?: SuitabilityWeights; market?: MarketDataset; now?: string } = {},
): RecommendationOutput {
  const parsed = farmerContextSchema.safeParse(rawContext);
  if (!parsed.success) {
    throw new Error(`Invalid farmer context: ${parsed.error.message}`);
  }
  const context = parsed.data;
  const weights = options.weights ?? DEFAULT_SUITABILITY_WEIGHTS;
  const datasets = getAgricultureDatasets();

  const zone = findZone(datasets, context.zoneId);
  if (!zone) throw new Error(`Unknown zone "${context.zoneId}".`);
  const season = findSeason(datasets, context.seasonId);
  if (!season) throw new Error(`Unknown season "${context.seasonId}".`);
  const soil = findSoil(datasets, context.soilId);

  let marketDataClass: "live" | "sample" | "none" = "none";
  let market: MarketDataset | undefined = options.market;
  if (!market) {
    try {
      market = loadDataset(marketDatasetSchema, "markets", "sample-quotes.json");
      marketDataClass = "sample";
    } catch {
      market = undefined;
    }
  } else {
    marketDataClass = market.quotes.some((q) => q.valueClass === "live") ? "live" : "sample";
  }

  const eligible: ScoredCandidate[] = [];
  const rejected: Array<{ cropId: string; violations: ConstraintMessage[] }> = [];

  for (const crop of datasets.crops.crops) {
    const constraints = evaluateConstraints({ context, crop, zone, season, soil });
    if (!constraints.eligible) {
      rejected.push({ cropId: crop.id, violations: constraints.violations });
      continue;
    }

    const suitability = scoreCrop({ context, crop, zone, season }, weights);
    const economics = estimateEconomicsFromCrop(crop);

    const positiveFactors = suitability.factors
      .filter((f) => f.impact === "positive")
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3)
      .map((f) => `${f.label}: ${f.reason}`);

    eligible.push({
      cropId: crop.id,
      cropName: crop.name,
      overallScore: suitability.overallScore,
      resilienceScore:
        suitability.factors.find((f) => f.key === "resilience")?.score ?? 0,
      warnings: constraints.warnings.map((w) => w.message),
      recommendation: {
        role: "primary",
        rank: 0,
        cropId: crop.id,
        suitability,
        constraints,
        confidence: { level: "medium", score: 0, reasons: [] },
        economics,
        whyRecommended: positiveFactors.length
          ? positiveFactors
          : ["Meets all hard constraints with no standout strengths."],
        whyRankedLower: [],
        warnings: constraints.warnings.map((w) => w.message),
      },
    });
  }

  eligible.sort(
    (a, b) =>
      b.recommendation.suitability.overallScore - a.recommendation.suitability.overallScore ||
      b.resilienceScore - a.resilienceScore ||
      a.cropId.localeCompare(b.cropId),
  );

  eligible.forEach((candidate, index) => {
    candidate.recommendation.rank = index + 1;
    candidate.recommendation.role =
      index === 0 ? "primary" : index === 1 ? "secondary" : candidate.recommendation.role;
  });

  const top = eligible[0] ?? null;
  const runnerUp = eligible[1] ?? null;

  let resilientAlternative: Recommendation | null = null;
  if (top) {
    const remaining = eligible.slice(2);
    if (remaining.length > 0) {
      const bestResilient = remaining.reduce((best, cur) =>
        cur.resilienceScore > best.resilienceScore ? cur : best,
      );
      if (
        bestResilient.resilienceScore >= 40 &&
        bestResilient.resilienceScore >= top.resilienceScore
      ) {
        bestResilient.recommendation.role = "resilient-alternative";
        resilientAlternative = bestResilient.recommendation;
      }
    }
  }

  for (const candidate of eligible) {
    const confidence = assessConfidence({
      datasetQuality: datasets.crops.meta.quality,
      warningsCount: candidate.warnings.length,
      topScore: candidate.recommendation.suitability.overallScore,
      runnerUpScore:
        candidate === top
          ? (runnerUp?.recommendation.suitability.overallScore ?? null)
          : (top?.recommendation.suitability.overallScore ?? null),
      hasLiveWeather: false,
      marketDataClass,
    });
    candidate.recommendation.confidence = confidence;
  }

  if (top) {
    for (const candidate of eligible.slice(1)) {
      candidate.recommendation.whyRankedLower = compareAgainstTop(candidate, top);
    }
  }

  return {
    engineVersion: ENGINE_VERSION,
    generatedAt: options.now ?? new Date().toISOString(),
    contextSummary: contextSummary(context),
    weightsUsed: weights as unknown as Record<string, number>,
    primary: top?.recommendation ?? null,
    secondary: runnerUp?.recommendation ?? null,
    resilientAlternative,
    rejected,
  };
}

function compareAgainstTop(candidate: ScoredCandidate, top: ScoredCandidate): string[] {
  return candidate.recommendation.suitability.factors
    .map((factor) => ({
      factor,
      topFactor: top.recommendation.suitability.factors.find((f) => f.key === factor.key),
    }))
    .filter(({ factor, topFactor }) => topFactor && topFactor.score - factor.score >= 8)
    .sort((a, b) => (b.topFactor!.score - b.factor.score) - (a.topFactor!.score - a.factor.score))
    .slice(0, 3)
    .map(
      ({ factor, topFactor }) =>
        `${factor.label}: scores ${factor.score} vs ${topFactor!.score} for ${top.cropName}. ${factor.reason}`,
    );
}
