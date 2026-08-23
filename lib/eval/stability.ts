import { generateRecommendations } from "@/lib/agriculture/recommend";
import { WATER_AVAILABILITY_LEVELS } from "@/lib/agriculture/context";
import type { EvalScenario, StabilityResult } from "./types";

const SOIL_NEIGHBOURS: Record<string, string[]> = {
  "deep-black": ["medium-black"],
  "medium-black": ["deep-black", "shallow-black"],
  "shallow-black": ["medium-black"],
  "alluvial-loam": ["sandy-loam"],
  "sandy-loam": ["alluvial-loam"],
  laterite: [],
};

function shiftWater(level: string, delta: number): string | undefined {
  const idx = WATER_AVAILABILITY_LEVELS.indexOf(level as (typeof WATER_AVAILABILITY_LEVELS)[number]);
  if (idx < 0) return undefined;
  const next = idx + delta;
  return next >= 0 && next < WATER_AVAILABILITY_LEVELS.length
    ? WATER_AVAILABILITY_LEVELS[next]
    : undefined;
}

function top3(engine: ReturnType<typeof generateRecommendations>): string[] {
  return engine.ranked.slice(0, 3).map((r) => r.cropId);
}

export function overlapRatioStandalone(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  return a.filter((id) => setB.has(id)).length / Math.max(a.length, b.length);
}

const overlapRatio = overlapRatioStandalone;

/**
 * Ranking stability under input perturbation: for each base scenario, nudge
 * water availability ±1 level and swap soil to its nearest textural neighbour,
 * then compare primary persistence and top-3 overlap. A deterministic engine
 * should degrade gracefully — small input changes should rarely reshuffle the
 * whole ranking.
 */
export function evaluateStability(scenarios: EvalScenario[]): StabilityResult[] {
  const results: StabilityResult[] = [];
  const bases = scenarios.filter((s) => s.expectations.expectedPrimary);

  for (const base of bases) {
    const baseline = generateRecommendations(base.context);
    const basePrimary = baseline.primary?.cropId ?? null;
    const baseTop3 = top3(baseline);

    for (const delta of [-1, 1]) {
      const water = shiftWater(base.context.waterAvailability, delta);
      if (!water || water === base.context.waterAvailability) continue;
      const engine = generateRecommendations({ ...base.context, waterAvailability: water });
      results.push({
        baseScenarioId: base.id,
        perturbation: `water ${base.context.waterAvailability}→${water}`,
        primaryPersisted: (engine.primary?.cropId ?? null) === basePrimary,
        top3OverlapRatio: Number(overlapRatio(baseTop3, top3(engine)).toFixed(4)),
      });
    }

    for (const soil of SOIL_NEIGHBOURS[base.context.soilId] ?? []) {
      const engine = generateRecommendations({ ...base.context, soilId: soil });
      results.push({
        baseScenarioId: base.id,
        perturbation: `soil ${base.context.soilId}→${soil}`,
        primaryPersisted: (engine.primary?.cropId ?? null) === basePrimary,
        top3OverlapRatio: Number(overlapRatio(baseTop3, top3(engine)).toFixed(4)),
      });
    }
  }

  return results;
}
