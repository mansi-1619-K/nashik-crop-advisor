import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvLocal } from "./loadEnv";
import { defaultAiCases, evaluateAiLayer } from "../../lib/eval/aiMetrics";

async function main() {
  loadEnvLocal();

  if (!process.env.GEMINI_API_KEY?.trim()) {
    process.stdout.write(
      "GEMINI_API_KEY is not set (checked process env and .env.local).\n" +
        "The AI narration layer was NOT measured. Deterministic metrics remain available via `npm run evaluate`.\n",
    );
    process.exitCode = 2;
    return;
  }

  const contexts = [
    { zoneId: "central-irrigated", seasonId: "rabi", soilId: "medium-black", waterAvailability: "assured" },
    { zoneId: "heavy-rainfall", seasonId: "kharif", soilId: "alluvial-loam", waterAvailability: "rainfed" },
    { zoneId: "arid-eastern", seasonId: "kharif", soilId: "shallow-black", waterAvailability: "rainfed" },
  ] as const;

  const cases = defaultAiCases(contexts.map((c) => ({ ...c })));
  process.stdout.write(`Running ${cases.length} live AI calls (model ${process.env.GEMINI_MODEL ?? "default"})...\n`);

  const summary = await evaluateAiLayer(cases);

  const outDir = resolve(process.cwd(), "evaluation/reports");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "ai-eval.json"), JSON.stringify(summary, null, 2));

  process.stdout.write(
    `\nAI-generated: ${summary.aiGeneratedCount}/${summary.callCount} (fallback rate ${summary.fallbackRate})\n` +
      `First-attempt schema validity: ${summary.firstAttemptValidityRate}\n` +
      `Mean attempts: ${summary.meanAttempts}\n` +
      `Latency p50/p95: ${summary.latencyMsP50}/${summary.latencyMsP95} ms\n` +
      `Citation emission rate: ${summary.citationEmissionRate}; calls with dropped hallucinated ids: ${summary.hallucinatedCitationCalls}\n` +
      `Saved: evaluation/reports/ai-eval.json\n`,
  );
}

void main();
