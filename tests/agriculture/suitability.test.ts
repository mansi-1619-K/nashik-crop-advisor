import { describe, expect, it } from "vitest";
import { scoreCrop } from "@/lib/agriculture/suitability";
import { getAgricultureDatasets, findZone, findSeason } from "@/lib/agriculture/datasets";
import { DEFAULT_SUITABILITY_WEIGHTS, weightsSum, type SuitabilityWeights } from "@/lib/agriculture/weights";
import type { FarmerContext } from "@/lib/agriculture/context";

const ds = getAgricultureDatasets();

function ctx(partial: Partial<FarmerContext> = {}): FarmerContext {
  return {
    zoneId: "central-irrigated",
    seasonId: "perennial",
    soilId: "alluvial-loam",
    waterAvailability: "assured",
    ...partial,
  };
}

function crop(id: string) {
  const found = ds.crops.crops.find((c) => c.id === id);
  if (!found) throw new Error(`crop ${id} missing`);
  return found;
}

function score(context: FarmerContext, cropId: string, weights?: SuitabilityWeights) {
  return scoreCrop(
    {
      context,
      crop: crop(cropId),
      zone: findZone(ds, context.zoneId)!,
      season: findSeason(ds, context.seasonId),
    },
    weights,
  );
}

describe("suitability scoring", () => {
  it("uses default weights that sum to 1", () => {
    expect(weightsSum(DEFAULT_SUITABILITY_WEIGHTS)).toBeCloseTo(1, 6);
  });

  it("throws on invalid weight configurations", () => {
    const bad = { ...DEFAULT_SUITABILITY_WEIGHTS, soil: 0.9 };
    expect(() => score(ctx(), "grape", bad)).toThrowError(/Invalid suitability weights/);
  });

  it("produces seven normalized factors with consistent math", () => {
    const result = score(ctx(), "grape");
    expect(result.factors).toHaveLength(7);
    let weighted = 0;
    for (const f of result.factors) {
      expect(f.score).toBeGreaterThanOrEqual(0);
      expect(f.score).toBeLessThanOrEqual(100);
      expect(f.weight).toBeGreaterThan(0);
      expect(f.contribution).toBeCloseTo(f.score * f.weight, 1);
      weighted += f.contribution;
    }
    const expected = Math.max(0, Math.min(100, Math.round(weighted - result.riskPenalty)));
    expect(result.overallScore).toBe(expected);
  });

  it("is deterministic for identical inputs", () => {
    const a = JSON.stringify(score(ctx(), "grape"));
    const b = JSON.stringify(score(ctx(), "grape"));
    expect(a).toBe(b);
  });

  it("rewards better soil compatibility in the overall score", () => {
    const onAlluvial = score(ctx({ soilId: "alluvial-loam" }), "grape").overallScore;
    const onDeepBlack = score(ctx({ soilId: "deep-black" }), "grape").overallScore;
    expect(onAlluvial).toBeGreaterThan(onDeepBlack);
  });

  it("scores drought-hardy bajra as more resilient than grapes", () => {
    const bajra = score(ctx({ zoneId: "arid-eastern", seasonId: "kharif", soilId: "shallow-black" }), "pearl-millet");
    const grape = score(ctx(), "grape");
    const factorOf = (r: ReturnType<typeof score>) =>
      r.factors.find((f) => f.key === "resilience")!.score;
    expect(factorOf(bajra)).toBeGreaterThan(factorOf(grape));
  });

  it("applies a positive risk penalty for high-severity disease profiles", () => {
    const paddy = score({ ...igatpuri() }, "paddy");
    expect(paddy.riskPenalty).toBeGreaterThan(0);
    expect(paddy.factors.find((f) => f.key === "diseaseRisk")!.score).toBeLessThan(100);
  });

  it("blends drought tolerance into water scoring under rainfed conditions", () => {
    const rainfed = score(
      ctx({ zoneId: "heavy-rainfall", seasonId: "kharif", soilId: "laterite", waterAvailability: "rainfed" }),
      "little-millet",
    );
    const water = rainfed.factors.find((f) => f.key === "water")!;
    expect(water.reason).toMatch(/drought tolerance/i);
  });
});

function igatpuri(): FarmerContext {
  return {
    zoneId: "heavy-rainfall",
    seasonId: "kharif",
    soilId: "laterite",
    waterAvailability: "rainfed",
  };
}
