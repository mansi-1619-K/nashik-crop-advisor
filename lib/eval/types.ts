import { z } from "zod";
import { farmerContextSchema } from "@/lib/agriculture/context";
import { datasetMetaSchema } from "@/lib/types/common";

const scenarioExpectationSchema = z
  .object({
    mustBeEligible: z.array(z.string()).optional(),
    mustBeExcluded: z.array(z.string()).optional(),
    expectedPrimary: z.string().optional(),
    forbiddenPrimary: z.array(z.string()).optional(),
    maxEligibleCount: z.number().int().min(0).optional(),
    allowEmptyRanking: z.boolean().optional(),
  })
  .refine(
    (e) =>
      !(e.allowEmptyRanking === false &&
        e.maxEligibleCount !== undefined &&
        e.maxEligibleCount === 0),
    { message: "maxEligibleCount 0 requires allowEmptyRanking (or omission)" },
  );

export const scenarioKindSchema = z.enum(["expert", "synthetic", "edge-case"]);

export const evalScenarioSchema = z.object({
  id: z.string().min(1),
  kind: scenarioKindSchema,
  description: z.string().min(1),
  context: farmerContextSchema,
  expectations: scenarioExpectationSchema,
});

export interface EvalScenario {
  id: string;
  kind: "expert" | "synthetic" | "edge-case";
  description: string;
  context: import("@/lib/agriculture/context").FarmerContext;
  expectations: ScenarioExpectations;
}

export interface ScenarioExpectations {
  mustBeEligible?: string[];
  mustBeExcluded?: string[];
  expectedPrimary?: string;
  forbiddenPrimary?: string[];
  maxEligibleCount?: number;
  allowEmptyRanking?: boolean;
}

export const scenariosFileSchema = z.object({
  meta: datasetMetaSchema,
  scenarios: z.array(evalScenarioSchema).min(1),
});

export interface ScenariosFile {
  meta: import("@/lib/types/common").DatasetMeta;
  scenarios: EvalScenario[];
}

export const retrievalLabelsFileSchema = z.object({
  meta: datasetMetaSchema,
  labels: z
    .array(
      z.object({
        query: z.string().min(3),
        relevant: z.array(z.string().min(1)).min(1),
      }),
    )
    .min(1),
});

export interface RetrievalLabelsFile {
  meta: import("@/lib/types/common").DatasetMeta;
  labels: Array<{ query: string; relevant: string[] }>;
}

export interface ScenarioRunResult {
  scenarioId: string;
  eligibleIds: string[];
  primaryId: string | null;
  failures: string[];
}

export interface EngineEvalSummary {
  scenarioCount: number;
  expectationFailures: number;
  totalExpectations: number;
  constraintViolationRate: number;
  primaryAccuracyMeasured: number;
  primaryAccuracyNumerator: number;
  primaryAccuracyDenominator: number;
  latencyMsP50: number;
  latencyMsP95: number;
  perScenario: Array<{
    id: string;
    kind: string;
    failures: string[];
    latencyMs: number;
  }>;
}

export interface StabilityResult {
  baseScenarioId: string;
  perturbation: string;
  primaryPersisted: boolean;
  top3OverlapRatio: number;
}

export interface RetrievalEvalSummary {
  queryCount: number;
  precisionAt3: number;
  recallAt3: number;
  mrr: number;
  misses: Array<{ query: string; retrieved: string[]; relevant: string[] }>;
}

export interface AiCallRecord {
  task: "advisory" | "chat";
  scenarioId: string;
  source: "ai_generated" | "static";
  firstAttemptValid: boolean;
  attempts: number;
  latencyMs: number;
  citationCount: number;
  hallucinatedCitations: number;
}

export interface AiEvalSummary {
  configured: boolean;
  model?: string;
  callCount: number;
  aiGeneratedCount: number;
  fallbackCount: number;
  fallbackRate: number;
  firstAttemptValidityRate: number;
  meanAttempts: number;
  latencyMsP50: number;
  latencyMsP95: number;
  citationEmissionRate: number;
  hallucinatedCitationCalls: number;
  note?: string;
}
