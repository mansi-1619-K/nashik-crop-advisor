import { describe, expect, it } from "vitest";
import { computeEconomics, estimateEconomicsFromCrop } from "@/lib/agriculture/economics";
import { getAgricultureDatasets } from "@/lib/agriculture/datasets";

const ds = getAgricultureDatasets();
const onion = ds.crops.crops.find((c) => c.id === "onion")!;

describe("economics engine", () => {
  it("computes mid-range economics with transparent formulas", () => {
    const summary = computeEconomics({ crop: onion });
    expect(summary.yieldQuintalPerAcre.value).toBe(160);
    expect(summary.priceInrPerQuintal.value).toBe(1650);
    expect(summary.inputCostInrPerAcre.value).toBe(40000);
    expect(summary.grossRevenueInrPerAcre).toBe(160 * 1650);
    expect(summary.netReturnInrPerAcre).toBe(264000 - 40000);
    expect(summary.breakEvenPriceInrPerQuintal).toBeCloseTo(40000 / 160, 0);
    expect(summary.roiPercent).toBeCloseTo(((264000 - 40000) / 40000) * 100, 1);
  });

  it("labels dataset defaults as estimated", () => {
    const summary = computeEconomics({ crop: onion });
    expect(summary.yieldQuintalPerAcre.sourceClass).toBe("estimated");
    expect(summary.priceInrPerQuintal.sourceClass).toBe("estimated");
    expect(summary.inputCostInrPerAcre.sourceClass).toBe("estimated");
  });

  it("prefers user-provided expectations and labels them user_provided", () => {
    const summary = computeEconomics({
      crop: onion,
      expectedYieldPerAcre: 180,
      expectedPriceInrPerQuintal: 2000,
    });
    expect(summary.yieldQuintalPerAcre.sourceClass).toBe("user_provided");
    expect(summary.priceInrPerQuintal.sourceClass).toBe("user_provided");
    expect(summary.grossRevenueInrPerAcre).toBe(180 * 2000);
  });

  it("uses a market quote for price when the farmer gives no override", () => {
    const summary = computeEconomics({
      crop: onion,
      quote: { modalPriceInr: 1400, valueClass: "static" },
    });
    expect(summary.priceInrPerQuintal.value).toBe(1400);
    expect(summary.priceInrPerQuintal.sourceClass).toBe("static");
    expect(summary.priceInrPerQuintal.basis).toMatch(/not a live observation/i);
  });

  it("scales totals by farm area when provided", () => {
    const summary = computeEconomics({ crop: onion, areaAcres: 3 });
    expect(summary.grossRevenueInrTotal).toBe(summary.grossRevenueInrPerAcre * 3);
    expect(summary.netReturnInrTotal).toBe(summary.netReturnInrPerAcre * 3);
  });

  it("produces ordered ranges from the range estimator", () => {
    const est = estimateEconomicsFromCrop(onion);
    expect(est.valueClass).toBe("estimated");
    expect(est.netReturnPerAcreInr.min).toBeLessThanOrEqual(est.netReturnPerAcreInr.max);
    expect(est.breakEvenPricePerQuintalInr.min).toBeLessThanOrEqual(
      est.breakEvenPricePerQuintalInr.max,
    );
  });
});
