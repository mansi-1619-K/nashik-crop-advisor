import type { RecommendationOutput } from "@/lib/agriculture/results";
import type { WeatherSignal } from "@/lib/agriculture/weatherRisk";
import { resolveCitations } from "@/lib/rag/evidence";
import type { Citation, EvidenceBundle } from "@/lib/rag/types";
import {
  generateValidated,
  type JsonGenerator,
} from "./gemini";
import { buildAdvisoryPayload } from "./prompts";
import { advisoryNarrativeSchema, type AdvisoryNarrative } from "./schemas";
import { buildFallbackNarrative } from "./fallback";

export interface AdvisoryResult {
  source: "ai_generated" | "static";
  narrative: Omit<AdvisoryNarrative, "citationIds">;
  citations?: Citation[];
  model?: string;
  attempts?: number;
  error?: string;
}

function splitCitations<T extends { citationIds?: string[] }>(
  payload: T,
  bundle: EvidenceBundle | undefined,
): { cleaned: Omit<T, "citationIds">; citations: Citation[] } {
  const { citationIds, ...cleaned } = payload;
  return {
    cleaned: cleaned as Omit<T, "citationIds">,
    citations: resolveCitations(citationIds, bundle ?? { chunks: [], citations: [], unavailable: false }),
  };
}

export function narrateRecommendation(input: {
  engine: RecommendationOutput;
  contextSummary: string;
  weatherSignals?: WeatherSignal[];
  weatherFreshness?: string | null;
  evidence?: EvidenceBundle;
  generator?: JsonGenerator | null;
}): Promise<AdvisoryResult> {
  const prompt = buildAdvisoryPayload({
    contextSummary: input.contextSummary,
    engine: input.engine,
    weatherSignals: input.weatherSignals,
    weatherFreshness: input.weatherFreshness ?? null,
    evidence: input.evidence,
  });

  return generateValidated({
    generator: input.generator,
    schema: advisoryNarrativeSchema,
    systemInstruction:
      "You narrate deterministic crop-advisory output for farmers in Nashik district. Never invent numbers. Respond only with the requested JSON.",
    prompt,
  }).then((result): AdvisoryResult => {
    if (result.ok && result.data) {
      const { cleaned, citations } = splitCitations(result.data, input.evidence);
      return {
        source: "ai_generated",
        narrative: cleaned,
        ...(citations.length > 0 ? { citations } : {}),
        model: result.model,
        attempts: result.attempts,
      };
    }
    return {
      source: "static",
      narrative: buildFallbackNarrative({
        engine: input.engine,
        weatherSignals: input.weatherSignals,
      }),
      attempts: result.attempts,
      error: `AI narration unavailable (${result.reason ?? "unknown"}) — showing deterministic fallback.`,
    };
  });
}
