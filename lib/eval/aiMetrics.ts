import { narrateRecommendation } from "@/lib/ai/advisory";
import { answerFarmQuestion } from "@/lib/ai/chat";
import { getGeminiGenerator, type JsonGenerator } from "@/lib/ai/gemini";
import { generateRecommendations } from "@/lib/agriculture/recommend";
import type { FarmerContext } from "@/lib/agriculture/context";
import { buildAdvisoryQuery } from "@/lib/rag/evidence";
import { getEvidenceRetriever } from "@/lib/rag/retrieve";
import type { EvidenceBundle } from "@/lib/rag/types";
import type { AiCallRecord, AiEvalSummary } from "./types";

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

/** Wraps the real generator to observe raw model output (for citation auditing). */
class RecordingGenerator implements JsonGenerator {
  lastRawByIds: string[] | undefined;

  constructor(private readonly inner: JsonGenerator) {}

  async generate(request: Parameters<JsonGenerator["generate"]>[0]): Promise<unknown> {
    const raw = await this.inner.generate(request);
    this.lastRawByIds =
      typeof raw === "object" && raw !== null && Array.isArray((raw as { citationIds?: unknown }).citationIds)
        ? ((raw as { citationIds: unknown[] }).citationIds.filter(
            (v): v is string => typeof v === "string",
          ))
        : undefined;
    return raw;
  }
}

export interface AiEvalCase {
  task: "advisory" | "chat";
  scenarioId: string;
  context: FarmerContext;
  question?: string;
}

export function defaultAiCases(contexts: FarmerContext[]): AiEvalCase[] {
  return [
    {
      task: "advisory",
      scenarioId: "central-rabi",
      context: contexts[0],
    },
    {
      task: "chat",
      scenarioId: "central-rabi",
      context: contexts[0],
      question: "Why is onion ranked first and how should I store my harvest?",
    },
    {
      task: "advisory",
      scenarioId: "heavy-rain-kharif",
      context: contexts[1],
    },
    {
      task: "chat",
      scenarioId: "heavy-rain-kharif",
      context: contexts[1],
      question: "What disease risks should I watch for in this rainy belt?",
    },
    {
      task: "chat",
      scenarioId: "arid-kharif",
      context: contexts[2],
      question: "When should I irrigate and what will this earn me?",
    },
  ];
}

export async function evaluateAiLayer(cases: AiEvalCase[]): Promise<AiEvalSummary> {
  const generator = getGeminiGenerator();
  if (!generator) {
    return {
      configured: false,
      callCount: 0,
      aiGeneratedCount: 0,
      fallbackCount: 0,
      fallbackRate: 1,
      firstAttemptValidityRate: 0,
      meanAttempts: 0,
      latencyMsP50: 0,
      latencyMsP95: 0,
      citationEmissionRate: 0,
      hallucinatedCitationCalls: 0,
      note: "GEMINI_API_KEY not set — live narration was skipped entirely.",
    };
  }

  const recorded = new RecordingGenerator(generator);
  const records: AiCallRecord[] = [];

  for (const testCase of cases) {
    const engine = generateRecommendations(testCase.context);
    let evidence: EvidenceBundle | undefined;
    try {
      evidence =
        testCase.task === "advisory"
          ? getEvidenceRetriever().retrieve(buildAdvisoryQuery(engine), { topK: 4 })
          : getEvidenceRetriever().retrieve(testCase.question ?? "", { topK: 3 });
    } catch {
      evidence = undefined;
    }

    const t0 = performance.now();
    const result =
      testCase.task === "advisory"
        ? await narrateRecommendation({
            engine,
            contextSummary: engine.contextSummary,
            evidence,
            generator: recorded,
          })
        : await answerFarmQuestion({
            question: testCase.question ?? "",
            engine,
            contextSummary: engine.contextSummary,
            evidence,
            generator: recorded,
          });
    const latencyMs = performance.now() - t0;

    const rawIds = recorded.lastRawByIds ?? [];
    const validIds = new Set((evidence?.chunks ?? []).map((c) => c.id));
    const hallucinated = rawIds.filter((id) => !validIds.has(id));

    records.push({
      task: testCase.task,
      scenarioId: testCase.scenarioId,
      source: result.source,
      firstAttemptValid: result.source === "ai_generated" && result.attempts === 1,
      attempts: result.attempts ?? 0,
      latencyMs: Number(latencyMs.toFixed(1)),
      citationCount: result.citations?.length ?? 0,
      hallucinatedCitations: hallucinated.length,
    });
  }

  const aiGenerated = records.filter((r) => r.source === "ai_generated");
  const latencies = records.map((r) => r.latencyMs);

  return {
    configured: true,
    model: process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash",
    callCount: records.length,
    aiGeneratedCount: aiGenerated.length,
    fallbackCount: records.length - aiGenerated.length,
    fallbackRate: Number(((records.length - aiGenerated.length) / records.length).toFixed(4)),
    firstAttemptValidityRate: Number(
      (aiGenerated.filter((r) => r.firstAttemptValid).length / Math.max(1, aiGenerated.length)).toFixed(4),
    ),
    meanAttempts: Number((records.reduce((s, r) => s + r.attempts, 0) / records.length).toFixed(3)),
    latencyMsP50: Number(percentile(latencies, 50).toFixed(1)),
    latencyMsP95: Number(percentile(latencies, 95).toFixed(1)),
    citationEmissionRate: Number(
      (records.filter((r) => r.citationCount > 0).length / records.length).toFixed(4),
    ),
    hallucinatedCitationCalls: records.filter((r) => r.hallucinatedCitations > 0).length,
  };
}
