import { z } from "zod";
import { datasetMetaSchema, type DatasetMeta } from "@/lib/types/common";

export const SOIL_IDS = [
  "deep-black",
  "medium-black",
  "shallow-black",
  "alluvial-loam",
  "laterite",
  "sandy-loam",
] as const;

export type SoilId = (typeof SOIL_IDS)[number];

export const soilIdSchema = z.enum(SOIL_IDS);

const drainageSchema = z.enum(["poor", "moderate", "good", "excessive"]);

export const soilSchema = z.object({
  id: soilIdSchema,
  name: z.string().min(1),
  localName: z.string().optional(),
  description: z.string().min(1),
  drainage: drainageSchema,
  waterRetention: z.enum(["low", "medium", "high"]),
  fertility: z.enum(["low", "medium", "high"]),
  typicalZones: z.array(z.string()).min(1),
  notes: z.array(z.string()),
});

export interface Soil {
  id: SoilId;
  name: string;
  localName?: string;
  description: string;
  drainage: "poor" | "moderate" | "good" | "excessive";
  waterRetention: "low" | "medium" | "high";
  fertility: "low" | "medium" | "high";
  typicalZones: string[];
  notes: string[];
}

export const soilsDatasetSchema = z.object({
  meta: datasetMetaSchema,
  soils: z.array(soilSchema).min(1),
});

export interface SoilsDataset {
  meta: DatasetMeta;
  soils: Soil[];
}
