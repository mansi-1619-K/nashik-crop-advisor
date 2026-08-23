import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { farmerContextSchema } from "@/lib/agriculture/context";
import { getKnowledgeChunks } from "@/lib/rag/corpus";
import { retrievalLabelsFileSchema, scenariosFileSchema } from "@/lib/eval/types";

const scenariosPath = "evaluation/scenarios/nashik-core-scenarios.json";
const labelsPath = "evaluation/benchmarks/retrieval-labels.json";

describe("scenario fixture contract", () => {
  const file = scenariosFileSchema.parse(
    JSON.parse(readFileSync(resolve(process.cwd(), scenariosPath), "utf-8")),
  );

  it("validates against the scenario schema", () => {
    expect(file.scenarios.length).toBeGreaterThanOrEqual(10);
  });

  it("uses only contexts the farmer context schema accepts", () => {
    for (const s of file.scenarios) {
      const parsed = farmerContextSchema.safeParse(s.context);
      expect(parsed.success, `${s.id} context invalid`).toBe(true);
    }
  });

  it("references known crop ids in expectations", () => {
    const cropIds = new Set(
      JSON.parse(readFileSync(resolve(process.cwd(), "data/crops/nashik-crops.json"), "utf-8"))
        .crops.map((c: { id: string }) => c.id),
    );
    for (const s of file.scenarios) {
      for (const id of [
        ...(s.expectations.mustBeEligible ?? []),
        ...(s.expectations.mustBeExcluded ?? []),
        ...(s.expectations.forbiddenPrimary ?? []),
        ...(s.expectations.expectedPrimary ? [s.expectations.expectedPrimary] : []),
      ]) {
        expect(cropIds.has(id), `${s.id} references unknown crop ${id}`).toBe(true);
      }
    }
  });

  it("covers all three scenario kinds", () => {
    const kinds = new Set(file.scenarios.map((s) => s.kind));
    expect(kinds.has("expert")).toBe(true);
    expect(kinds.has("synthetic")).toBe(true);
    expect(kinds.has("edge-case")).toBe(true);
  });
});

describe("retrieval labels contract", () => {
  const docIds = new Set(getKnowledgeChunks().map((c) => c.documentId));

  const file = retrievalLabelsFileSchema.parse(
    JSON.parse(readFileSync(resolve(process.cwd(), labelsPath), "utf-8")),
  );

  it("labels only documents that exist in the corpus", () => {
    for (const label of file.labels) {
      for (const id of label.relevant) {
        expect(docIds.has(id), `unknown document ${id}`).toBe(true);
      }
    }
  });

  it("has unique queries", () => {
    const queries = file.labels.map((l) => l.query);
    expect(new Set(queries).size).toBe(queries.length);
  });
});
