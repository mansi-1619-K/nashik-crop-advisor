import { z } from "zod";
import { datasetMetaSchema, type DatasetMeta } from "@/lib/types/common";

export const SEASON_IDS = ["kharif", "rabi", "summer", "perennial"] as const;

export type SeasonId = (typeof SEASON_IDS)[number];

export const seasonIdSchema = z.enum(SEASON_IDS);

const monthListSchema = z
  .array(z.number().int().min(1).max(12))
  .min(1)
  .refine((months) => new Set(months).size === months.length, {
    message: "months must not repeat",
  });

export const seasonSchema = z.object({
  id: seasonIdSchema,
  name: z.string().min(1),
  months: monthListSchema,
  description: z.string().min(1),
  rainfedViability: z.enum(["high", "medium", "low"]),
  notes: z.array(z.string()),
});

export interface Season {
  id: SeasonId;
  name: string;
  months: number[];
  description: string;
  rainfedViability: "high" | "medium" | "low";
  notes: string[];
}

export const seasonsDatasetSchema = z.object({
  meta: datasetMetaSchema,
  seasons: z.array(seasonSchema).min(1),
});

export interface SeasonsDataset {
  meta: DatasetMeta;
  seasons: Season[];
}
