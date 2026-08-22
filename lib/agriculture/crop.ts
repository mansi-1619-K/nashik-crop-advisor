import { z } from "zod";
import { rangeSchema, severitySchema, datasetMetaSchema, type DatasetMeta } from "@/lib/types/common";
import { zoneIdSchema } from "./zone";
import { soilIdSchema } from "./soil";
import { seasonIdSchema } from "./season";

export const WATER_DEMANDS = ["low", "medium", "high"] as const;
export type WaterDemand = (typeof WATER_DEMANDS)[number];
export const waterDemandSchema = z.enum(WATER_DEMANDS);

export const COMPATIBILITY_LEVELS = ["excellent", "good", "moderate", "poor", "unsuitable"] as const;
export type CompatibilityLevel = (typeof COMPATIBILITY_LEVELS)[number];
export const compatibilityLevelSchema = z.enum(COMPATIBILITY_LEVELS);

export const CROP_CATEGORIES = ["cereal", "millet", "pulse", "oilseed", "vegetable", "fruit"] as const;
export type CropCategory = (typeof CROP_CATEGORIES)[number];
export const cropCategorySchema = z.enum(CROP_CATEGORIES);

export const growthStageSchema = z
  .object({
    name: z.string().min(1),
    approxStartDay: z.number().int().min(0),
    approxEndDay: z.number().int().min(1),
  })
  .refine((s) => s.approxStartDay <= s.approxEndDay, {
    message: "growth stage start day must be <= end day",
  });

export interface GrowthStage {
  name: string;
  approxStartDay: number;
  approxEndDay: number;
}

export const diseaseRiskSchema = z.object({
  name: z.string().min(1),
  favouredConditions: z.string().min(1),
  typicalSeverity: severitySchema,
});

export interface DiseaseRisk {
  name: string;
  favouredConditions: string;
  typicalSeverity: "none" | "low" | "moderate" | "high";
}

export const soilCompatibilityEntrySchema = z.object({
  soilId: soilIdSchema,
  level: compatibilityLevelSchema,
});

export interface SoilCompatibility {
  soilId: import("./soil").SoilId;
  level: CompatibilityLevel;
}

export const cropEconomicsSchema = z.object({
  inputCostPerAcreInr: rangeSchema,
  yieldPerAcre: z.object({
    unit: z.string().min(1),
    typicalRange: rangeSchema,
  }),
  pricePerUnitInr: z.object({
    unit: z.string().min(1),
    typicalRange: rangeSchema,
  }),
  dataQuality: z.enum(["assumed", "curated", "sample"]),
});

export interface CropEconomics {
  inputCostPerAcreInr: import("@/lib/types/common").Range;
  yieldPerAcre: { unit: string; typicalRange: import("@/lib/types/common").Range };
  pricePerUnitInr: { unit: string; typicalRange: import("@/lib/types/common").Range };
  dataQuality: "assumed" | "curated" | "sample";
}

export const cropSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    scientificName: z.string().optional(),
    marathiName: z.string().optional(),
    category: cropCategorySchema,
    zones: z.array(zoneIdSchema).min(1),
    seasons: z.array(seasonIdSchema).min(1),
    soilCompatibility: z
      .array(soilCompatibilityEntrySchema)
      .min(1)
      .refine((entries) => new Set(entries.map((e) => e.soilId)).size === entries.length, {
        message: "soilCompatibility entries must have unique soilId values",
      }),
    waterDemand: waterDemandSchema,
    droughtTolerance: z.number().int().min(0).max(100),
    floodTolerance: z.number().int().min(0).max(100),
    temperatureRangeC: rangeSchema,
    rainfallRangeMm: rangeSchema,
    growthDurationDays: rangeSchema,
    growthStages: z.array(growthStageSchema).min(1),
    diseaseRisks: z.array(diseaseRiskSchema),
    economics: cropEconomicsSchema,
    notes: z.array(z.string()).min(1),
  })
  .refine((c) => c.temperatureRangeC.min <= c.temperatureRangeC.max, {
    message: "temperatureRangeC.min must be <= max",
  })
  .refine((c) => c.growthDurationDays.min <= c.growthDurationDays.max, {
    message: "growthDurationDays.min must be <= max",
  });

export interface Crop {
  id: string;
  name: string;
  scientificName?: string;
  marathiName?: string;
  category: CropCategory;
  zones: import("./zone").ZoneId[];
  seasons: import("./season").SeasonId[];
  soilCompatibility: SoilCompatibility[];
  waterDemand: WaterDemand;
  droughtTolerance: number;
  floodTolerance: number;
  temperatureRangeC: import("@/lib/types/common").Range;
  rainfallRangeMm: import("@/lib/types/common").Range;
  growthDurationDays: import("@/lib/types/common").Range;
  growthStages: GrowthStage[];
  diseaseRisks: DiseaseRisk[];
  economics: CropEconomics;
  notes: string[];
}

export interface CropsDataset {
  meta: DatasetMeta;
  crops: Crop[];
}

export const cropsDatasetSchema = z.object({
  meta: datasetMetaSchema,
  crops: z.array(cropSchema).min(1),
});
