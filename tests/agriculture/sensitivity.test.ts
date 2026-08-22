import { describe, expect, it } from "vitest";
import {
  buildDefaultScenarios,
  downgradeWater,
  runSensitivity,
} from "@/lib/agriculture/sensitivity";
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

describe("sensitivity engine", () => {
  it("produces the six default scenarios with base first", () => {
    const report = runSensitivity(niphadOnion);
    expect(report.rows).toHaveLength(6);
    expect(report.rows[0].id).toBe("base");
    expect(report.totalScenarios).toBe(5);
  });

  it("matches the recommendation engine's primary in the base row", () => {
    const recs = generateRecommendations(niphadOnion, { now: "2026-08-22T00:00:00Z" });
    const report = runSensitivity(niphadOnion, { now: "2026-08-22T00:00:00Z" });
    expect(report.basePrimaryCropId).toBe(recs.primary?.cropId);
    expect(report.rows[0].primaryCropId).toBe(recs.primary?.cropId);
    expect(report.rows[0].primaryScore).toBe(recs.primary?.suitability.overallScore);
  });

  it("computes deltas relative to the base top crop", () => {
    const report = runSensitivity(niphadOnion);
    for (const row of report.rows.slice(1)) {
      if (row.primaryScore === null) continue;
      const baseTop = report.rows[0];
      const expected =
        row.topRanking[0] && baseTop.topRanking[0]
          ? Number((row.topRanking[0].score - baseTop.topRanking[0].score).toFixed(1))
          : null;
      expect(row.deltas.scoreDelta).toBe(expected);
      expect(row.deltas.profitDeltaInr).not.toBeNull();
    }
  });

  it("shows negative profit delta when prices crash 15%", () => {
    const report = runSensitivity(niphadOnion);
    const priceRow = report.rows.find((r) => r.id === "market-price-minus-15")!;
    expect(priceRow.deltas.profitDeltaInr).toBeLessThanOrEqual(0);
  });

  it("tracks where the base primary lands under stress", () => {
    const report = runSensitivity(malegaonBajra);
    for (const row of report.rows.slice(1)) {
      expect(row.deltas.basePrimaryRank === null || row.deltas.basePrimaryRank >= 1).toBe(true);
    }
  });

  it("keeps rainfed contexts stable under the water-downgrade scenario", () => {
    const report = runSensitivity(malegaonBajra);
    const waterRow = report.rows.find((r) => r.id === "water-one-level-lower")!;
    expect(waterRow.label).toContain("rainfed");
    expect(waterRow.primaryCropId).toBe(report.basePrimaryCropId);
  });

  it("downgrades water one level for irrigated contexts", () => {
    expect(downgradeWater("assured")).toBe("moderate");
    expect(downgradeWater("moderate")).toBe("limited");
    expect(downgradeWater("limited")).toBe("rainfed");
    expect(downgradeWater("rainfed")).toBe("rainfed");
  });

  it("honours custom scenario lists", () => {
    const report = runSensitivity(niphadOnion, {
      now: "2026-08-22T00:00:00Z",
      scenarios: [
        { id: "base", label: "Base", overrides: {} },
        { id: "yield-plus-20", label: "Yield +20%", overrides: { yieldFactor: 1.2 } },
      ],
    });
    expect(report.rows.map((r) => r.id)).toEqual(["base", "yield-plus-20"]);
    const yieldRow = report.rows[1];
    expect(yieldRow.deltas.profitDeltaInr).toBeGreaterThan(0);
  });

  it("summarises ranking stability honestly", () => {
    const report = runSensitivity(malegaonBajra);
    expect(report.stableScenarioCount).toBeLessThanOrEqual(report.totalScenarios);
    expect(report.notes.join(" ")).toMatch(/stays #1/);
  });

  it("is deterministic given a fixed clock", () => {
    const a = JSON.stringify(runSensitivity(niphadOnion, { now: "2026-08-22T00:00:00Z" }));
    const b = JSON.stringify(runSensitivity(niphadOnion, { now: "2026-08-22T00:00:00Z" }));
    expect(a).toBe(b);
  });

  it("throws a descriptive error for invalid contexts", () => {
    expect(() => runSensitivity({ zoneId: "nowhere" })).toThrowError(/Invalid farmer context/);
    expect(buildDefaultScenarios(niphadOnion)).toHaveLength(6);
  });
});
