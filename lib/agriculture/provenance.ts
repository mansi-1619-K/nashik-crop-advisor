import { z } from "zod";
import type { DataSourceClass } from "@/lib/types/common";

export { datasetMetaSchema } from "@/lib/types/common";
export type { DatasetMeta } from "@/lib/types/common";

export interface SourcedValue<T> {
  value: T;
  class: DataSourceClass;
  note?: string;
}

export function sourced<T>(value: T, klass: DataSourceClass, note?: string): SourcedValue<T> {
  return { value, class: klass, note };
}

export const provenanceNotesSchema = z.array(
  z.object({
    field: z.string().min(1),
    note: z.string().min(1),
  }),
);

export interface ProvenanceNote {
  field: string;
  note: string;
}
