import type { EconomicEstimate } from "./results";
import type { Crop } from "./crop";

function roundInr(value: number): number {
  return Math.round(value);
}

export function estimateEconomicsFromCrop(crop: Crop): EconomicEstimate {
  const { inputCostPerAcreInr, yieldPerAcre, pricePerUnitInr } = crop.economics;

  const grossMin = yieldPerAcre.typicalRange.min * pricePerUnitInr.typicalRange.min;
  const grossMax = yieldPerAcre.typicalRange.max * pricePerUnitInr.typicalRange.max;

  const netMin = grossMin - inputCostPerAcreInr.max;
  const netMax = grossMax - inputCostPerAcreInr.min;

  const breakEvenMin = yieldPerAcre.typicalRange.max > 0
    ? inputCostPerAcreInr.min / yieldPerAcre.typicalRange.max
    : 0;
  const breakEvenMax = yieldPerAcre.typicalRange.min > 0
    ? inputCostPerAcreInr.max / yieldPerAcre.typicalRange.min
    : Number.POSITIVE_INFINITY;

  const roiMin = inputCostPerAcreInr.max > 0 ? (netMin / inputCostPerAcreInr.max) * 100 : 0;
  const roiMax = inputCostPerAcreInr.min > 0 ? (netMax / inputCostPerAcreInr.min) * 100 : 0;

  return {
    valueClass: "estimated",
    currency: "INR",
    basis: `Range math over crop dataset economics for ${crop.name} (quality: ${crop.economics.dataQuality}); midpoints drive the suitability economic factor.`,
    inputCostPerAcreInr: { min: inputCostPerAcreInr.min, max: inputCostPerAcreInr.max },
    grossRevenuePerAcreInr: { min: roundInr(grossMin), max: roundInr(grossMax) },
    netReturnPerAcreInr: { min: roundInr(netMin), max: roundInr(netMax) },
    breakEvenPricePerQuintalInr: {
      min: Number(breakEvenMin.toFixed(2)),
      max: Number.isFinite(breakEvenMax) ? Number(breakEvenMax.toFixed(2)) : breakEvenMax,
    },
    roiPercent: { min: Number(roiMin.toFixed(1)), max: Number(roiMax.toFixed(1)) },
  };
}
