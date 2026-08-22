import { z } from "zod";
import { zoneIdSchema } from "./zone";
import { soilIdSchema } from "./soil";
import { seasonIdSchema } from "./season";
import { datasetMetaSchema, type DatasetMeta } from "@/lib/types/common";

export const WATER_AVAILABILITY_LEVELS = ["rainfed", "limited", "moderate", "assured"] as const;
export type WaterAvailability = (typeof WATER_AVAILABILITY_LEVELS)[number];
export const waterAvailabilitySchema = z.enum(WATER_AVAILABILITY_LEVELS);

export const IRRIGATION_METHODS = ["none", "flood", "furrow", "sprinkler", "drip"] as const;
export type IrrigationMethod = (typeof IRRIGATION_METHODS)[number];
export const irrigationMethodSchema = z.enum(IRRIGATION_METHODS);

export const RISK_PREFERENCES = ["conservative", "balanced", "growth"] as const;
export type RiskPreference = (typeof RISK_PREFERENCES)[number];
export const riskPreferenceSchema = z.enum(RISK_PREFERENCES);

const positiveNumber = z.number().positive();
const nonNegativeInt = z.number().int().nonnegative();

export const coreContextSchema = z.object({
  zoneId: zoneIdSchema,
  seasonId: seasonIdSchema,
  soilId: soilIdSchema,
  waterAvailability: waterAvailabilitySchema,
});

export interface CoreFarmerContext {
  zoneId: import("./zone").ZoneId;
  seasonId: import("./season").SeasonId;
  soilId: import("./soil").SoilId;
  waterAvailability: WaterAvailability;
}

export const advancedInputsSchema = z.object({
  talukaId: z.string().optional(),
  areaAcres: positiveNumber.optional(),
  irrigationMethod: irrigationMethodSchema.optional(),
  previousCropId: z.string().optional(),
  budgetInr: nonNegativeInt.optional(),
  riskPreference: riskPreferenceSchema.optional(),
  expectedYieldPerAcre: positiveNumber.optional(),
  expectedPricePerUnitInr: positiveNumber.optional(),
});

export interface AdvancedInputs {
  talukaId?: string;
  areaAcres?: number;
  irrigationMethod?: IrrigationMethod;
  previousCropId?: string;
  budgetInr?: number;
  riskPreference?: RiskPreference;
  expectedYieldPerAcre?: number;
  expectedPricePerUnitInr?: number;
}

export const farmerContextSchema = coreContextSchema.extend(advancedInputsSchema.shape);

export type FarmerContext = CoreFarmerContext & AdvancedInputs;

export function parseFarmerContext(input: unknown): FarmerContext | null {
  const result = farmerContextSchema.safeParse(input);
  return result.success ? result.data : null;
}

const presetScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  context: coreContextSchema.extend(advancedInputsSchema.shape),
});

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  context: FarmerContext;
}

export const presetsDatasetSchema = z.object({
  meta: datasetMetaSchema,
  presets: z.array(presetScenarioSchema).min(1),
});

export interface PresetsDataset {
  meta: DatasetMeta;
  presets: PresetScenario[];
}
