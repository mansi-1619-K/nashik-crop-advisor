import { z } from "zod";
import { rangeSchema, type Range } from "@/lib/types/common";
import { datasetMetaSchema, type DatasetMeta } from "./provenance";

export const ZONE_IDS = ["heavy-rainfall", "central-irrigated", "arid-eastern"] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

export const zoneIdSchema = z.enum(ZONE_IDS);

export const talukaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lat: z.number().min(15).max(22),
  lng: z.number().min(72).max(77),
  coordPrecision: z.enum(["approximate", "geocoded"]),
});

export interface Taluka {
  id: string;
  name: string;
  lat: number;
  lng: number;
  coordPrecision: "approximate" | "geocoded";
}

export const zoneSchema = z.object({
  id: zoneIdSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  talukas: z.array(talukaSchema).min(1),
  characteristics: z.object({
    annualRainfallMm: rangeSchema,
    humidity: z.enum(["low", "medium", "high"]),
    terrain: z.string().min(1),
    irrigationAccess: z.enum(["scarce", "partial", "widespread"]),
  }),
  notes: z.array(z.string()),
});

export interface Zone {
  id: ZoneId;
  name: string;
  description: string;
  talukas: Taluka[];
  characteristics: {
    annualRainfallMm: Range;
    humidity: "low" | "medium" | "high";
    terrain: string;
    irrigationAccess: "scarce" | "partial" | "widespread";
  };
  notes: string[];
}

export interface ZonesDataset {
  meta: DatasetMeta;
  zones: Zone[];
}

export const zonesDatasetSchema = z.object({
  meta: datasetMetaSchema,
  zones: z.array(zoneSchema).min(1),
});
