import type { FactorImpact, FactorScore, SuitabilityFactorKey, SuitabilityResult } from "./results";
import type { Crop } from "./crop";
import type { FarmerContext } from "./context";
import type { Season } from "./season";
import type { Zone } from "./zone";
import {
  COMPATIBILITY_SCORES,
  DEFAULT_SUITABILITY_WEIGHTS,
  RISK_PENALTY_SCALE,
  SEVERITY_PENALTIES,
  WATER_AVAILABILITY_INDEX,
  WATER_DEMAND_REQUIREMENT,
  clampScore,
  validateWeights,
  type SuitabilityWeights,
} from "./weights";

const FACTOR_LABELS: Record<SuitabilityFactorKey, string> = {
  soil: "Soil compatibility",
  water: "Water suitability",
  climate: "Climate fit",
  season: "Season alignment",
  economic: "Economic potential",
  resilience: "Resilience",
  diseaseRisk: "Disease risk",
};

export interface ScoreInputs {
  context: FarmerContext;
  crop: Crop;
  zone: Zone;
  season: Season | undefined;
}

function impactFor(score: number): FactorImpact {
  if (score >= 75) return "positive";
  if (score < 50) return "negative";
  return "neutral";
}

function rainfallCoverage(crop: Crop, zone: Zone): number {
  const span = crop.rainfallRangeMm.max - crop.rainfallRangeMm.min;
  if (span <= 0) return 0;
  const overlapMin = Math.max(crop.rainfallRangeMm.min, zone.characteristics.annualRainfallMm.min);
  const overlapMax = Math.min(crop.rainfallRangeMm.max, zone.characteristics.annualRainfallMm.max);
  const overlap = Math.max(0, overlapMax - overlapMin);
  return overlap / span;
}

function averageSeverityPenalty(crop: Crop): number {
  if (crop.diseaseRisks.length === 0) return 0;
  const total = crop.diseaseRisks.reduce(
    (sum, risk) => sum + SEVERITY_PENALTIES[risk.typicalSeverity],
    0,
  );
  return total / crop.diseaseRisks.length;
}

function soilFactor(crop: Crop, context: FarmerContext): FactorScore {
  const entry = crop.soilCompatibility.find((sc) => sc.soilId === context.soilId);
  const level = entry?.level ?? "moderate";
  const score = COMPATIBILITY_SCORES[level];
  const reason = entry
    ? `Rated "${level}" on this soil class.`
    : `No explicit rating for this soil; defaulted to "moderate" — treat with caution.`;
  return {
    key: "soil",
    label: FACTOR_LABELS.soil,
    score,
    weight: 0,
    contribution: 0,
    impact: impactFor(score),
    reason,
  };
}

function waterFactor(crop: Crop, context: FarmerContext, zone: Zone): FactorScore {
  const available = WATER_AVAILABILITY_INDEX[context.waterAvailability];
  const required = WATER_DEMAND_REQUIREMENT[crop.waterDemand];
  const monsoonSupported =
    context.waterAvailability === "rainfed" &&
    zone.characteristics.annualRainfallMm.min >= 900 &&
    context.seasonId === "kharif";
  const effectiveAvailable = monsoonSupported ? Math.max(available, 1) : available;
  const surplus = effectiveAvailable - required;

  let base: number;
  if (surplus >= 2) base = 100;
  else if (surplus === 1) base = 88;
  else if (surplus === 0) base = 72;
  else base = 45;

  const blendWeight = effectiveAvailable <= 1 ? 0.35 : 0;
  const score = clampScore(base * (1 - blendWeight) + crop.droughtTolerance * blendWeight);
  const parts = [
    `${crop.waterDemand} demand vs "${context.waterAvailability}" availability`,
  ];
  if (monsoonSupported) parts.push("monsoon rainfall substitutes for irrigation this season");
  if (blendWeight > 0) parts.push(`blended with drought tolerance ${crop.droughtTolerance}/100`);
  return {
    key: "water",
    label: FACTOR_LABELS.water,
    score,
    weight: 0,
    contribution: 0,
    impact: impactFor(score),
    reason: `${parts.join("; ")}.`,
  };
}

function climateFactor(crop: Crop, zone: Zone): FactorScore {
  const coverage = rainfallCoverage(crop, zone);
  const score = clampScore(coverage * 100);
  const reason =
    coverage >= 0.999
      ? `Zone rainfall band sits fully inside ${crop.name}'s acceptable range (${crop.rainfallRangeMm.min}-${crop.rainfallRangeMm.max} mm).`
      : `About ${(coverage * 100).toFixed(0)}% of ${crop.name}'s rainfall range (${crop.rainfallRangeMm.min}-${crop.rainfallRangeMm.max} mm) overlaps the zone band (${zone.characteristics.annualRainfallMm.min}-${zone.characteristics.annualRainfallMm.max} mm).`;
  return {
    key: "climate",
    label: FACTOR_LABELS.climate,
    score,
    weight: 0,
    contribution: 0,
    impact: impactFor(score),
    reason,
  };
}

function seasonFactor(crop: Crop, context: FarmerContext, season: Season | undefined): FactorScore {
  let score = 90;
  const viability = season?.rainfedViability ?? "medium";
  if (viability === "high") score += 10;
  if (context.waterAvailability === "rainfed") {
    if (viability === "low") score -= 50;
    else if (viability === "medium") score -= 25;
  } else if (context.waterAvailability === "limited" && viability === "low") {
    score -= 30;
  }
  score = clampScore(score);
  const seasonName = season?.name ?? context.seasonId;
  return {
    key: "season",
    label: FACTOR_LABELS.season,
    score,
    weight: 0,
    contribution: 0,
    impact: impactFor(score),
    reason: `${crop.name} is a ${seasonName} crop; season rainfed viability is "${viability}".`,
  };
}

function economicFactor(crop: Crop): FactorScore {
  const { inputCostPerAcreInr, yieldPerAcre, pricePerUnitInr } = crop.economics;
  const midYield = (yieldPerAcre.typicalRange.min + yieldPerAcre.typicalRange.max) / 2;
  const midPrice = (pricePerUnitInr.typicalRange.min + pricePerUnitInr.typicalRange.max) / 2;
  const midCost = (inputCostPerAcreInr.min + inputCostPerAcreInr.max) / 2;
  const grossRevenue = midYield * midPrice;
  const netReturn = grossRevenue - midCost;
  const roiPercent = midCost > 0 ? (netReturn / midCost) * 100 : 0;
  const score = roiPercent <= 0 ? 5 : clampScore(Math.min(100, roiPercent / 2));
  return {
    key: "economic",
    label: FACTOR_LABELS.economic,
    score,
    weight: 0,
    contribution: 0,
    impact: impactFor(score),
    reason: `Mid-range estimate: ~₹${Math.round(grossRevenue).toLocaleString("en-IN")} gross vs ~₹${Math.round(midCost).toLocaleString("en-IN")} cost per acre (~${roiPercent.toFixed(0)}% ROI). ASSUMED dataset values.`,
  };
}

function resilienceFactor(crop: Crop): FactorScore {
  const score = clampScore(crop.droughtTolerance * 0.6 + crop.floodTolerance * 0.4);
  return {
    key: "resilience",
    label: FACTOR_LABELS.resilience,
    score,
    weight: 0,
    contribution: 0,
    impact: impactFor(score),
    reason: `Drought tolerance ${crop.droughtTolerance}/100, flood tolerance ${crop.floodTolerance}/100.`,
  };
}

function diseaseRiskFactors(crop: Crop): { score: FactorScore; riskPenalty: number } {
  const avgPenalty = averageSeverityPenalty(crop);
  const score = clampScore(100 - avgPenalty);
  const worst = [...crop.diseaseRisks].sort(
    (a, b) => SEVERITY_PENALTIES[b.typicalSeverity] - SEVERITY_PENALTIES[a.typicalSeverity],
  )[0];
  const reason = worst
    ? `Highest flagged risk: ${worst.name} (${worst.typicalSeverity}) under ${worst.favouredConditions.toLowerCase()}.`
    : "No significant disease risks recorded.";
  return {
    score: {
      key: "diseaseRisk",
      label: FACTOR_LABELS.diseaseRisk,
      score,
      weight: 0,
      contribution: 0,
      impact: impactFor(score),
      reason,
    },
    riskPenalty: Math.round(avgPenalty * RISK_PENALTY_SCALE),
  };
}

export function scoreCrop(
  inputs: ScoreInputs,
  weights: SuitabilityWeights = DEFAULT_SUITABILITY_WEIGHTS,
): SuitabilityResult {
  const { valid, sum } = validateWeights(weights);
  if (!valid) {
    throw new Error(`Invalid suitability weights (sum=${sum}); weights must be non-negative and sum to 1.`);
  }

  const { context, crop, zone, season } = inputs;

  const factors: FactorScore[] = [
    soilFactor(crop, context),
    waterFactor(crop, context, zone),
    climateFactor(crop, zone),
    seasonFactor(crop, context, season),
    economicFactor(crop),
    resilienceFactor(crop),
  ];
  const { score: diseaseFactor, riskPenalty } = diseaseRiskFactors(crop);
  factors.push(diseaseFactor);

  let weighted = 0;
  for (const factor of factors) {
    factor.weight = weights[factor.key];
    factor.contribution = Number((factor.score * factor.weight).toFixed(2));
    weighted += factor.contribution;
  }

  const overallScore = clampScore(weighted - riskPenalty);

  return {
    cropId: crop.id,
    overallScore,
    factors,
    riskPenalty,
  };
}
