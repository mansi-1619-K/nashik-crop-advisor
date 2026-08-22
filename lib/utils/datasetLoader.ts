import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ZodType } from "zod";

export class DatasetLoadError extends Error {
  constructor(
    public path: string,
    cause: string,
  ) {
    super(`Failed to load dataset at ${path}: ${cause}`);
  }
}

export class DatasetValidationError extends Error {
  constructor(
    public path: string,
    issues: string,
  ) {
    super(`Dataset failed validation at ${path}:\n${issues}`);
  }
}

export function loadDataset<T>(schema: ZodType<T>, ...pathSegments: string[]): T {
  const path = resolve(process.cwd(), "data", ...pathSegments);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf-8"));
  } catch (error) {
    throw new DatasetLoadError(path, error instanceof Error ? error.message : String(error));
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new DatasetValidationError(path, parsed.error.message);
  }
  return parsed.data;
}
