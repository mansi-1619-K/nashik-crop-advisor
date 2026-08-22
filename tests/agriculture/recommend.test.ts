import { describe, expect, it } from "vitest";
import { generateRecommendations } from "@/lib/agriculture/recommend";
import type { FarmerContext } from "@/lib/agriculture/context";

const niphadOnion: FarmerContext = {
  zoneId: "central-irrigated",
  seasonId: "rabi",
  soilId: "medium-black",
  waterAvailability: "assured",
};

const malegaonBajra: FarmerContext = {
  zoneId: "arid-eastern",
  seasonId: "kharif",
  soilId: "shallow-black",
  waterAvailability: "rainfed",
};

describe("recommendation engine", () => {
  it("recommends onion first for the Niphad irrigated rabi scenario", () => {
    const output = generateRecommendations(niphadOnion);
    expect(output.primary).not.toBeNull();
    expect(output.primary!.cropId).toBe("onion");
    expect(output.primary!.rank).toBe(1);
    expect(output.primary!.role).toBe("primary");
  });

  it("provides alternatives with explicit lower-ranking reasons", () => {
    const output = generateRecommendations(niphadOnion);
    expect(output.secondary).not.toBeNull();
    expect(output.secondary!.role).toBe("secondary");
    expect(output.secondary!.whyRankedLower.length).toBeGreaterThan(0);

    if (output.resilientAlternative) {
      expect(output.resilientAlternative.role).toBe("resilient-alternative");
      expect(output.resilientAlternative.whyRankedLower.length).toBeGreaterThan(0);
    }
  });

  it("ranks tomato second and rejects perennial-only crops outside their season", () => {
    const output = generateRecommendations(niphadOnion);
    expect(output.secondary?.cropId).toBe("tomato");
    expect(output.rejected.map((r) => r.cropId)).toContain("guava");
    const guavaRejection = output.rejected.find((r) => r.cropId === "guava")!;
    expect(guavaRejection.violations.map((v) => v.code)).toContain("season-incompatible");
    expect(output.resilientAlternative?.cropId ?? null).not.toBe("onion");
  });

  it("keeps bajra competitive for the Malegaon drought scenario", () => {
    const output = generateRecommendations(malegaonBajra);
    expect(output.primary).not.toBeNull();
    const topTwo = [output.primary!.cropId, output.secondary?.cropId];
    expect(topTwo).toContain("pearl-millet");
  });

  it("rejects water-incompatible soybean under rainfed arid conditions", () => {
    const output = generateRecommendations(malegaonBajra);
    const soybean = output.rejected.find((r) => r.cropId === "soybean");
    expect(soybean).toBeDefined();
    expect(soybean!.violations.map((v) => v.code)).toContain("water-incompatible");
  });

  it("reports honest low/medium confidence under Phase-1 data quality", () => {
    const output = generateRecommendations(niphadOnion);
    expect(["low", "medium"]).toContain(output.primary!.confidence.level);
    expect(output.primary!.confidence.reasons.length).toBeGreaterThan(0);
    expect(output.primary!.confidence.reasons.join(" ")).toMatch(/assumption|sample|weather/i);
  });

  it("attaches estimated economics to every recommendation", () => {
    const output = generateRecommendations(niphadOnion);
    expect(output.primary!.economics).not.toBeNull();
    expect(output.primary!.economics!.valueClass).toBe("estimated");
    const { netReturnPerAcreInr } = output.primary!.economics!;
    expect(netReturnPerAcreInr.min).toBeLessThanOrEqual(netReturnPerAcreInr.max);
  });

  it("is deterministic across repeated runs", () => {
    const a = JSON.stringify(generateRecommendations(niphadOnion, { now: "2026-08-22T00:00:00.000Z" }));
    const b = JSON.stringify(generateRecommendations(niphadOnion, { now: "2026-08-22T00:00:00.000Z" }));
    expect(a).toBe(b);
  });

  it("throws a descriptive error for invalid contexts", () => {
    expect(() => generateRecommendations({ zoneId: "mars" })).toThrowError(
      /Invalid farmer context/,
    );
  });

  it("returns null primary when nothing is eligible", () => {
    const output = generateRecommendations({
      zoneId: "heavy-rainfall",
      seasonId: "summer",
      soilId: "laterite",
      waterAvailability: "rainfed",
    });
    expect(output.primary).toBeNull();
    expect(Object.keys(output.weightsUsed)).toHaveLength(7);
  });
});
