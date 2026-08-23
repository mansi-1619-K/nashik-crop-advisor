import { generateRecommendations } from "@/lib/agriculture/recommend";
import type { RecommendationOutput } from "@/lib/agriculture/results";
import type {
  EngineEvalSummary,
  EvalScenario,
  ScenarioRunResult,
  ScenariosFile,
} from "./types";

function eligibleCropIds(engine: RecommendationOutput): string[] {
  return engine.ranked.map((r) => r.cropId);
}

/**
 * Run one scenario and diff the engine's behaviour against its expectations.
 * Every failed expectation is returned as a human-readable failure string so
 * reports can show exactly which claim broke, not just a rate.
 */
export function runScenario(scenario: EvalScenario): ScenarioRunResult {
  const engine = generateRecommendations(scenario.context);
  const eligible = new Set(eligibleCropIds(engine));
  const rejected = new Set(engine.rejected.map((r) => r.cropId));
  const primaryId = engine.primary?.cropId ?? null;
  const failures: string[] = [];
  const e = scenario.expectations;

  for (const crop of e.mustBeEligible ?? []) {
    if (!eligible.has(crop)) failures.push(`expected ELIGIBLE: ${crop} (was excluded/rejected)`);
  }
  for (const crop of e.mustBeExcluded ?? []) {
    if (eligible.has(crop)) failures.push(`expected EXCLUDED: ${crop} (was eligible)`);
    if (!rejected.has(crop) && !eligible.has(crop)) {
      failures.push(`expected EXCLUDED: ${crop} not found in rejection list either`);
    }
  }
  if (e.expectedPrimary && primaryId !== e.expectedPrimary) {
    failures.push(`expected PRIMARY ${e.expectedPrimary}, engine ranked ${primaryId ?? "nothing"}`);
  }
  for (const crop of e.forbiddenPrimary ?? []) {
    if (primaryId === crop) failures.push(`FORBIDDEN PRIMARY occurred: ${crop}`);
  }
  if (e.maxEligibleCount !== undefined && eligible.size > e.maxEligibleCount) {
    failures.push(`expected ≤${e.maxEligibleCount} eligible, got ${eligible.size}`);
  }

  return { scenarioId: scenario.id, eligibleIds: [...eligible], primaryId, failures };
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

/** Agreement between expected top-K prefix and engine top-K prefix. */
export function topKAgreement(expected: string[], actual: string[], k: number): number {
  const exp = expected.slice(0, k);
  const act = new Set(actual.slice(0, k));
  if (exp.length === 0) return 1;
  return exp.filter((id) => act.has(id)).length / exp.length;
}

export function evaluateScenarios(file: ScenariosFile): EngineEvalSummary {
  const perScenario: EngineEvalSummary["perScenario"] = [];
  let totalExpectations = 0;
  let expectationFailures = 0;
  let violationExpectations = 0;
  let violationFailures = 0;
  let primaryNumerator = 0;
  let primaryDenominator = 0;

  for (const scenario of file.scenarios) {
    const t0 = performance.now();
    const result = runScenario(scenario);
    const latencyMs = performance.now() - t0;

    perScenario.push({
      id: scenario.id,
      kind: scenario.kind,
      failures: result.failures,
      latencyMs: Number(latencyMs.toFixed(3)),
    });

    const claimed = [
      ...(scenario.expectations.mustBeEligible ?? []),
      ...(scenario.expectations.mustBeExcluded ?? []),
      ...(scenario.expectations.forbiddenPrimary ?? []),
    ];
    totalExpectations += claimed.length + (scenario.expectations.expectedPrimary ? 1 : 0);
    expectationFailures += result.failures.length;

    // constraint-violation rate: share of mustBeExcluded claims that held
    const exclusions = scenario.expectations.mustBeExcluded ?? [];
    violationExpectations += exclusions.length;
    violationFailures += result.failures.filter((f) =>
      f.startsWith("expected EXCLUDED"),
    ).length;

    if (scenario.expectations.expectedPrimary) {
      primaryDenominator += 1;
      if (result.primaryId === scenario.expectations.expectedPrimary) primaryNumerator += 1;
    }
  }

  const latencies = perScenario.map((s) => s.latencyMs);
  return {
    scenarioCount: file.scenarios.length,
    expectationFailures,
    totalExpectations,
    constraintViolationRate:
      violationExpectations === 0
        ? 1
        : Number(((violationExpectations - violationFailures) / violationExpectations).toFixed(4)),
    primaryAccuracyMeasured:
      primaryDenominator === 0
        ? 0
        : Number((primaryNumerator / primaryDenominator).toFixed(4)),
    primaryAccuracyNumerator: primaryNumerator,
    primaryAccuracyDenominator: primaryDenominator,
    latencyMsP50: Number(percentile(latencies, 50).toFixed(3)),
    latencyMsP95: Number(percentile(latencies, 95).toFixed(3)),
    perScenario,
  };
}
