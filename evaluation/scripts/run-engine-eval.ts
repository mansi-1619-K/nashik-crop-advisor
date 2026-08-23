import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateScenarios } from "../../lib/eval/engineMetrics";
import { evaluateRetrieval } from "../../lib/eval/retrievalMetrics";
import { evaluateStability } from "../../lib/eval/stability";
import { renderEvaluationReport } from "../../lib/eval/report";
import type { AiEvalSummary, ScenariosFile, RetrievalLabelsFile } from "../../lib/eval/types";

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf-8")) as T;
}

function loadOptionalAiSummary(): AiEvalSummary | null {
  try {
    return loadJson<AiEvalSummary>("evaluation/reports/ai-eval.json");
  } catch {
    return null;
  }
}

async function main() {
  const scenarios = loadJson<ScenariosFile>("evaluation/scenarios/nashik-core-scenarios.json");
  const labels = loadJson<RetrievalLabelsFile>("evaluation/benchmarks/retrieval-labels.json");

  process.stdout.write(`Running ${scenarios.scenarios.length} engine scenarios...\n`);
  const engine = evaluateScenarios(scenarios);

  process.stdout.write("Measuring ranking stability under perturbation...\n");
  const stability = evaluateStability(scenarios.scenarios);

  process.stdout.write(`Scoring retrieval over ${labels.labels.length} labelled queries...\n`);
  const retrieval = evaluateRetrieval(labels);

  const ai = loadOptionalAiSummary();
  if (ai) {
    process.stdout.write(
      ai.configured
        ? "Merging previously recorded live-AI summary (ai-eval.json).\n"
        : "ai-eval.json records an unconfigured run; AI section stays NOT MEASURED.\n",
    );
  }

  const report = renderEvaluationReport({
    generatedAt: new Date().toISOString(),
    engine,
    retrieval,
    stability,
    ai,
  });

  const outDir = resolve(process.cwd(), "evaluation/reports");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "engine-eval.json"), JSON.stringify({ engine, stability, retrieval }, null, 2));
  writeFileSync(resolve(outDir, "EVALUATION_REPORT.md"), report);

  process.stdout.write(
    `\nDone. Expectation failures: ${engine.expectationFailures}/${engine.totalExpectations}\n` +
      `Primary accuracy: ${engine.primaryAccuracyMeasured} (${engine.primaryAccuracyNumerator}/${engine.primaryAccuracyDenominator})\n` +
      `Constraint-violation rate: ${engine.constraintViolationRate}\n` +
      `Retrieval P@3 ${retrieval.precisionAt3} / R@3 ${retrieval.recallAt3} / MRR ${retrieval.mrr}\n` +
      `Report: evaluation/reports/EVALUATION_REPORT.md\n`,
  );

  if (engine.expectationFailures > 0) {
    for (const s of engine.perScenario.filter((x) => x.failures.length > 0)) {
      process.stdout.write(`FAIL ${s.id}: ${s.failures.join("; ")}\n`);
    }
    process.exitCode = 1;
  }
}

void main();
