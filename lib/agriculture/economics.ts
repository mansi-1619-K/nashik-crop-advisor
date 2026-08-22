import type { EconomicEstimate } from "./results";
import type { Crop } from "./crop";
import type { DataSourceClass } from "@/lib/types/common";

function roundInr(value: number): number {
  return Math.round(value);
}

export interface SourcedNumber {
  value: number;
  sourceClass: DataSourceClass;
  basis: string;
}

export interface EconomicSummary {
  currency: "INR";
  perAcre: true;
  yieldQuintalPerAcre: SourcedNumber;
  priceInrPerQuintal: SourcedNumber;
  inputCostInrPerAcre: SourcedNumber;
  grossRevenueInrPerAcre: number;
  netReturnInrPerAcre: number;
  breakEvenPriceInrPerQuintal: number;
  roiPercent: number;
  areaAcres: number | null;
  grossRevenueInrTotal: number | null;
  netReturnInrTotal: number | null;
}

export interface ComputeEconomicsInput {
  crop: Crop;
  expectedYieldPerAcre?: number;
  expectedPriceInrPerQuintal?: number;
  quote?: { modalPriceInr: number; valueClass: DataSourceClass } | null;
  areaAcres?: number;
}

export function computeEconomics(input: ComputeEconomicsInput): EconomicSummary {
  const { crop, areaAcres = null } = input;
  const { inputCostPerAcreInr, yieldPerAcre, pricePerUnitInr } = crop.economics;

  const midYield = (yieldPerAcre.typicalRange.min + yieldPerAcre.typicalRange.max) / 2;
  const midPrice = (pricePerUnitInr.typicalRange.min + pricePerUnitInr.typicalRange.max) / 2;
  const midCost = (inputCostPerAcreInr.min + inputCostPerAcreInr.max) / 2;

  let effectiveYield = midYield;
  let yieldSource: SourcedNumber = {
    value: midYield,
    sourceClass: "estimated",
    basis: `Dataset midpoint for ${crop.name} (${crop.economics.dataQuality} quality).`,
  };
  if (typeof input.expectedYieldPerAcre === "number") {
    effectiveYield = input.expectedYieldPerAcre;
    yieldSource = {
      value: effectiveYield,
      sourceClass: "user_provided",
      basis: "Farmer-provided expected yield.",
    };
  }

  let effectivePrice = midPrice;
  let priceSource: SourcedNumber = {
    value: midPrice,
    sourceClass: "estimated",
    basis: `Dataset midpoint price band for ${crop.name} (${crop.economics.dataQuality} quality).`,
  };
  if (input.quote && typeof input.expectedPriceInrPerQuintal !== "number") {
    effectivePrice = input.quote.modalPriceInr;
    priceSource = {
      value: effectivePrice,
      sourceClass: input.quote.valueClass,
      basis:
        input.quote.valueClass === "live"
          ? "Live market quote (modal price)."
          : "Sample market quote (modal price) — STATIC, not a live observation.",
    };
  }
  if (typeof input.expectedPriceInrPerQuintal === "number") {
    effectivePrice = input.expectedPriceInrPerQuintal;
    priceSource = {
      value: effectivePrice,
      sourceClass: "user_provided",
      basis: "Farmer-provided expected price.",
    };
  }

  const costSource: SourcedNumber = {
    value: midCost,
    sourceClass: "estimated",
    basis: `Dataset midpoint of assumed input-cost range (${crop.economics.dataQuality} quality).`,
  };

  const grossRevenue = effectiveYield * effectivePrice;
  const netReturn = grossRevenue - midCost;
  const breakEven = effectiveYield > 0 ? midCost / effectiveYield : Number.POSITIVE_INFINITY;
  const roiPercent = midCost > 0 ? (netReturn / midCost) * 100 : 0;

  return {
    currency: "INR",
    perAcre: true,
    yieldQuintalPerAcre: yieldSource,
    priceInrPerQuintal: priceSource,
    inputCostInrPerAcre: costSource,
    grossRevenueInrPerAcre: roundInr(grossRevenue),
    netReturnInrPerAcre: roundInr(netReturn),
    breakEvenPriceInrPerQuintal: Number.isFinite(breakEven)
      ? Number(breakEven.toFixed(2))
      : breakEven,
    roiPercent: Number(roiPercent.toFixed(1)),
    areaAcres,
    grossRevenueInrTotal: areaAcres ? roundInr(grossRevenue * areaAcres) : null,
    netReturnInrTotal: areaAcres ? roundInr(netReturn * areaAcres) : null,
  };
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
