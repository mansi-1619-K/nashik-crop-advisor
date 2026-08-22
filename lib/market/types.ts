import { z } from "zod";
import {
  dataSourceClassSchema,
  datasetMetaSchema,
  type DatasetMeta,
  type DataSourceClass,
} from "@/lib/types/common";

export const marketQuoteSchema = z.object({
  cropId: z.string().min(1),
  marketLabel: z.string().min(1),
  commodityName: z.string().min(1),
  unit: z.literal("INR/quintal"),
  priceMinInr: z.number().nonnegative(),
  priceMaxInr: z.number().nonnegative(),
  modalPriceInr: z.number().nonnegative(),
  observedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valueClass: dataSourceClassSchema,
  note: z.string().optional(),
});

export interface MarketQuote {
  cropId: string;
  marketLabel: string;
  commodityName: string;
  unit: "INR/quintal";
  priceMinInr: number;
  priceMaxInr: number;
  modalPriceInr: number;
  observedOn: string;
  valueClass: DataSourceClass;
  note?: string;
}

export const marketDatasetSchema = z
  .object({
    meta: datasetMetaSchema,
    quotes: z.array(marketQuoteSchema).min(1),
  })
  .refine((ds) => new Set(ds.quotes.map((q) => q.cropId)).size === ds.quotes.length, {
    message: "quotes must contain at most one entry per cropId",
  });

export interface MarketDataset {
  meta: DatasetMeta;
  quotes: MarketQuote[];
}
