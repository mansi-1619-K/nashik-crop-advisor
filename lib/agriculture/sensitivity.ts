import type { FarmerContext, WaterAvailability } from "./context";
import { farmerContextSchema } from "./context";
import type { Crop } from "./crop";
import { evaluateConstraints } from "./constraints";
import { scoreCrop } from "./suitability";
import { estimateEconomicsFromCrop } from "./economics";
import {
  findSeason,
  findSoil,
  findZone,
  getAgricultureDatasets,
} from "./datasets";
import { ENGINE_VERSION } from "./recommend";
import { DEFAULT_SUITABILITY_WEIGHTS, type SuitabilityWeights } from "./weights";

export interface ScenarioOverrides {
  rainfallScale?: number;
  waterOverride?: WaterAvailability;
  priceFactor?: number;
  costFactor?: number;
  yieldFactor?: number;
}

export interface SensitivityScenario {
  id: string;
  label: string;
  description?: string;
  overrides: ScenarioOverrides;
}

const WATER_DOWNGRADE: Record<WaterAvailability, WaterAvailability> = {
  assured: "moderate",
  moderate: "limited",
  limited: "rainfed",
  rainfed: "rainfed",
};

export function downgradeWater(level: WaterAvailability): WaterAvailability {
  return WATER_DOWNGRADE[level];
}

function scaledZone<T extends { characteristics: { annualRainfallMm: { min: number; max: number } } }>(
  zone: T,
  scale: number,
): T {
  if (scale === 1) return zone;
  return {
    ...zone,
    characteristics: {
      ...zone.characteristics,
      annualRainfallMm: {
        min: Math.round(zone.characteristics.annualRainfallMm.min * scale),
        max: Math.round(zone.characteristics.annualRainfallMm.max * scale),
      },
    },
  };
}

function scaledCrop(crop: Crop, o: ScenarioOverrides): Crop {
  const { priceFactor = 1, costFactor = 1, yieldFactor = 1 } = o;
  if (priceFactor === 1 && costFactor === 1 && yieldFactor === 1) return crop;
  const e = crop.economics;
  return {
    ...crop,
    economics: {
      ...e,
      inputCostPerAcreInr: {
        min: Math.round(e.inputCostPerAcreInr.min * costFactor),
        max: Math.round(e.inputCostPerAcreInr.max * costFactor),
      },
      yieldPerAcre: {
        ...e.yieldPerAcre,
        typicalRange: {
          min: Number((e.yieldPerAcre.typicalRange.min * yieldFactor).toFixed(2)),
          max: Number((e.yieldPerAcre.typicalRange.max * yieldFactor).toFixed(2)),
        },
      },
      pricePerUnitInr: {
        ...e.pricePerUnitInr,
        typicalRange: {
          min: Math.round(e.pricePerUnitInr.typicalRange.min * priceFactor),
          max: Math.round(e.pricePerUnitInr.typicalRange.max * priceFactor),
        },
      },
    },
  };
}

interface RankedCandidate {
  cropId: string;
  cropName: string;
  score: number;
  resilienceScore: number;
  riskPenalty: number;
  netReturnMidInr: number;
}

function rankForScenario(
  context: FarmerContext,
  overrides: ScenarioOverrides,
): RankedCandidate[] {
  const datasets = getAgricultureDatasets();
  const baseZone = findZone(datasets, context.zoneId);
  if (!baseZone) throw new Error(`Unknown zone "${context.zoneId}".`);
  const season = findSeason(datasets, context.seasonId);
  if (!season) throw new Error(`Unknown season "${context.seasonId}".`);
  const soil = findSoil(datasets, context.soilId);

  const zone = scaledZone(baseZone, overrides.rainfallScale ?? 1);
  const effectiveContext: FarmerContext = overrides.waterOverride
    ? { ...context, waterAvailability: overrides.waterOverride }
    : context;

  const ranked: RankedCandidate[] = [];
  for (const crop of datasets.crops.crops) {
    const scenarioCrop = scaledCrop(crop, overrides);
    const constraints = evaluateConstraints({
      context: effectiveContext,
      crop: scenarioCrop,
      zone,
      season,
      soil,
    });
    if (!constraints.eligible) continue;
    const suitability = scoreCrop(
      { context: effectiveContext, crop: scenarioCrop, zone, season },
      DEFAULT_SUITABILITY_WEIGHTS,
    );
    const economics = estimateEconomicsFromCrop(scenarioCrop);
    const resilience =
      suitability.factors.find((f) => f.key === "resilience")?.score ?? 0;
    ranked.push({
      cropId: crop.id,
      cropName: crop.name,
      score: suitability.overallScore,
      resilienceScore: resilience,
      riskPenalty: suitability.riskPenalty,
      netReturnMidInr: Math.round(
        (economics.netReturnPerAcreInr.min + economics.netReturnPerAcreInr.max) / 2,
      ),
    });
  }

  return ranked.sort(
    (a, b) => b.score - a.score || b.resilienceScore - a.resilienceScore || a.cropId.localeCompare(b.cropId),
  );
}

export interface SensitivityRow extends SensitivityScenario {
  primaryCropId: string | null;
  primaryScore: number | null;
  netReturnMidInr: number | null;
  resilienceScore: number | null;
  riskPenalty: number | null;
  topRanking: Array<{ cropId: string; score: number }>;
  deltas: {
    scoreDelta: number | null;
    profitDeltaInr: number | null;
    resilienceDelta: number | null;
    basePrimaryRank: number | null;
  };
}

export interface SensitivityReport {
  engineVersion: string;
  generatedAt: string;
  contextSummary: string;
  basePrimaryCropId: string | null;
  stableScenarioCount: number;
  totalScenarios: number;
  rows: SensitivityRow[];
  notes: string[];
}

export function buildDefaultScenarios(context: FarmerContext): SensitivityScenario[] {
  return [
    { id: "base", label: "Base case", description: "Your current inputs.", overrides: {} },
    {
      id: "rainfall-minus-20",
      label: "Rainfall −20%",
      description: "A weaker monsoon year.",
      overrides: { rainfallScale: 0.8 },
    },
    {
      id: "rainfall-minus-40",
      label: "Rainfall −40%",
      description: "Severe rainfall deficit.",
      overrides: { rainfallScale: 0.6 },
    },
    {
      id: "market-price-minus-15",
      label: "Market price −15%",
      description: "Price crash at sale time.",
      overrides: { priceFactor: 0.85 },
    },
    {
      id: "input-cost-plus-10",
      label: "Input cost +10%",
      description: "Fertilizer/labour inflation.",
      overrides: { costFactor: 1.1 },
    },
    {
      id: "water-one-level-lower",
      label: `Water → ${downgradeWater(context.waterAvailability)}`,
      description: "Irrigation availability drops one level.",
      overrides: { waterOverride: downgradeWater(context.waterAvailability) },
    },
  ];
}

export function runSensitivity(
  rawContext: unknown,
  options: {
    scenarios?: SensitivityScenario[];
    now?: string;
    weights?: SuitabilityWeights;
  } = {},
): SensitivityReport {
  const parsed = farmerContextSchema.safeParse(rawContext);
  if (!parsed.success) {
    throw new Error(`Invalid farmer context: ${parsed.error.message}`);
  }
  const context = parsed.data;
  const scenarios = options.scenarios ?? buildDefaultScenarios(context);

  const baseRanking = rankForScenario(context, {});
  const basePrimaryId = baseRanking[0]?.cropId ?? null;

  const rows: SensitivityRow[] = scenarios.map((scenario) => {
    const isBase = Object.keys(scenario.overrides).length === 0;
    const ranking = isBase ? baseRanking : rankForScenario(context, scenario.overrides);
    const primary = ranking[0] ?? null;
    const baseTop = baseRanking[0] ?? null;

    const basePrimaryPosition = basePrimaryId
      ? ranking.findIndex((c) => c.cropId === basePrimaryId)
      : -1;

    return {
      id: scenario.id,
      label: scenario.label,
      description: scenario.description,
      overrides: scenario.overrides,
      primaryCropId: primary?.cropId ?? null,
      primaryScore: primary?.score ?? null,
      netReturnMidInr: primary?.netReturnMidInr ?? null,
      resilienceScore: primary?.resilienceScore ?? null,
      riskPenalty: primary?.riskPenalty ?? null,
      topRanking: ranking.slice(0, 5).map((c) => ({ cropId: c.cropId, score: c.score })),
      deltas: {
        scoreDelta:
          !isBase && primary && baseTop
            ? Number((primary.score - baseTop.score).toFixed(1))
            : null,
        profitDeltaInr:
          !isBase && primary && baseTop
            ? primary.netReturnMidInr - baseTop.netReturnMidInr
            : null,
        resilienceDelta:
          !isBase && primary && baseTop
            ? Number((primary.resilienceScore - baseTop.resilienceScore).toFixed(1))
            : null,
        basePrimaryRank:
          basePrimaryPosition >= 0 ? basePrimaryPosition + 1 : null,
      },
    };
  });

  const nonBaseRows = rows.filter((r) => Object.keys(r.overrides).length > 0);
  const stableCount = nonBaseRows.filter((r) => r.primaryCropId === basePrimaryId).length;

  const notes: string[] = [
    "Profit deltas compare each scenario's top-ranked crop against the BASE case's top-ranked crop.",
    `The base recommendation stays #1 in ${stableCount}/${nonBaseRows.length} stress scenarios.`,
  ];
  if (basePrimaryId === null) {
    notes.push("No eligible crops even in the base case — adjust the farm context.");
  }

  const zoneName = findZone(getAgricultureDatasets(), context.zoneId)?.name ?? context.zoneId;
  return {
    engineVersion: ENGINE_VERSION,
    generatedAt: options.now ?? new Date().toISOString(),
    contextSummary: `${zoneName} · ${context.seasonId} · ${context.soilId} · water: ${context.waterAvailability}`,
    basePrimaryCropId: basePrimaryId,
    stableScenarioCount: stableCount,
    totalScenarios: nonBaseRows.length,
    rows,
    notes,
  };
}
