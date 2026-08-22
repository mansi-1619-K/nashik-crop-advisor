import { z } from "zod";

export const rangeSchema = z
  .object({
    min: z.number(),
    max: z.number(),
  })
  .refine((r) => r.min <= r.max, { message: "range.min must be <= range.max" });

export interface Range {
  min: number;
  max: number;
}

export const DATA_SOURCE_CLASSES = [
  "live",
  "static",
  "estimated",
  "heuristic",
  "ai_generated",
  "user_provided",
] as const;

export type DataSourceClass = (typeof DATA_SOURCE_CLASSES)[number];

export const dataSourceClassSchema = z.enum(DATA_SOURCE_CLASSES);

export const severityLevels = ["none", "low", "moderate", "high"] as const;

export type Severity = (typeof severityLevels)[number];

export const severitySchema = z.enum(severityLevels);

export const confidenceLevels = ["high", "medium", "low"] as const;

export type ConfidenceLevel = (typeof confidenceLevels)[number];

export const confidenceLevelSchema = z.enum(confidenceLevels);

export const sourceRefSchema = z.object({
  label: z.string().min(1),
  url: z.string().url().optional(),
  retrievedAt: z.string().optional(),
});

export interface SourceRef {
  label: string;
  url?: string;
  retrievedAt?: string;
}

export const DATASET_QUALITIES = ["assumed", "curated", "sample"] as const;

export type DatasetQuality = (typeof DATASET_QUALITIES)[number];

export const datasetMetaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected ISO date (YYYY-MM-DD)"),
  quality: z.enum(DATASET_QUALITIES),
  disclaimer: z.string().optional(),
  sources: z.array(sourceRefSchema).min(1),
});

export interface DatasetMeta {
  id: string;
  name: string;
  version: string;
  updated: string;
  quality: DatasetQuality;
  disclaimer?: string;
  sources: SourceRef[];
}

export function datasetEnvelope<T extends z.ZodType>(contentSchema: T) {
  return z.object({
    meta: datasetMetaSchema,
    data: contentSchema,
  });
}
