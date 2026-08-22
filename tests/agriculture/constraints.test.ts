import { describe, expect, it } from "vitest";
import { evaluateConstraints } from "@/lib/agriculture/constraints";
import { getAgricultureDatasets, findZone, findSeason, findSoil } from "@/lib/agriculture/datasets";
import type { FarmerContext } from "@/lib/agriculture/context";

const ds = getAgricultureDatasets();

const igatpuriPaddy: FarmerContext = {
  zoneId: "heavy-rainfall",
  seasonId: "kharif",
  soilId: "laterite",
  waterAvailability: "rainfed",
};

function ctx(partial: Partial<FarmerContext>): FarmerContext {
  return { ...igatpuriPaddy, ...partial };
}

function crop(id: string) {
  const found = ds.crops.crops.find((c) => c.id === id);
  if (!found) throw new Error(`crop ${id} missing`);
  return found;
}

function evaluate(context: FarmerContext, cropId: string) {
  return evaluateConstraints({
    context,
    crop: crop(cropId),
    zone: findZone(ds, context.zoneId)!,
    season: findSeason(ds, context.seasonId),
    soil: findSoil(ds, context.soilId),
  });
}

describe("hard agronomic constraints", () => {
  it("passes the Igatpuri monsoon paddy scenario cleanly", () => {
    const result = evaluate(igatpuriPaddy, "paddy");
    expect(result.eligible).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("rejects grapes outside their zone AND outside their rainfall window", () => {
    const result = evaluate(ctx({}), "grape");
    expect(result.eligible).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain("zone-out-of-range");
    expect(result.violations.map((v) => v.code)).toContain("climate-severely-incompatible");
  });

  it("rejects paddy outside the kharif window", () => {
    const result = evaluate(
      ctx({ zoneId: "central-irrigated", seasonId: "rabi", soilId: "medium-black", waterAvailability: "assured" }),
      "paddy",
    );
    expect(result.eligible).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain("season-incompatible");
  });

  it("rejects medium-demand onion on rainfed central-belt land (no monsoon substitution)", () => {
    const result = evaluate(
      ctx({ zoneId: "central-irrigated", seasonId: "kharif", soilId: "medium-black", waterAvailability: "rainfed" }),
      "onion",
    );
    expect(result.eligible).toBe(false);
    expect(result.violations.some((v) => v.code === "water-incompatible")).toBe(true);
    expect(result.warnings.some((w) => w.code === "climate-borderline")).toBe(true);
  });

  it("allows high-demand paddy when monsoon rainfall substitutes for irrigation", () => {
    const result = evaluate(igatpuriPaddy, "paddy");
    expect(result.violations.filter((v) => v.code === "water-incompatible")).toHaveLength(0);
  });

  it("flags borderline water margins as warnings, not violations", () => {
    const result = evaluate(
      ctx({ waterAvailability: "limited" }),
      "finger-millet",
    );
    expect(result.eligible).toBe(true);
    expect(result.warnings.some((w) => w.code === "water-borderline")).toBe(true);
  });

  it("rejects crops rated unsuitable on the selected soil", () => {
    const result = evaluate(
      ctx({ zoneId: "central-irrigated", seasonId: "perennial", soilId: "laterite", waterAvailability: "moderate" }),
      "grape",
    );
    expect(result.eligible).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain("soil-severely-incompatible");
  });

  it("warns when climate fit is partial but non-zero", () => {
    const result = evaluate(
      ctx({ zoneId: "arid-eastern", seasonId: "kharif", soilId: "sandy-loam", waterAvailability: "rainfed" }),
      "little-millet",
    );
    expect(result.eligible).toBe(true);
    expect(result.warnings.some((w) => w.code === "climate-borderline")).toBe(true);
  });

  it("keeps violations machine-readable with factor attribution", () => {
    const result = evaluate(ctx({}), "grape");
    for (const violation of result.violations) {
      expect(["season", "water", "soil", "climate", "zone"]).toContain(violation.factor);
      expect(violation.message.length).toBeGreaterThan(10);
    }
  });
});
