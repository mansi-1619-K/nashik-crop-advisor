import type { RecommendationOutput } from "@/lib/agriculture/results";
import type { WeatherSignal } from "@/lib/agriculture/weatherRisk";
import {
  generateValidated,
  type JsonGenerator,
} from "./gemini";
import { buildAdvisoryPayload } from "./prompts";
import { advisoryNarrativeSchema, type AdvisoryNarrative } from "./schemas";
import { buildFallbackNarrative } from "./fallback";

export interface AdvisoryResult {
  source: "ai_generated" | "static";
  narrative: AdvisoryNarrative;
  model?: string;
  attempts?: number;
  error?: string;
}

export function narrateRecommendation(input: {
  engine: RecommendationOutput;
  contextSummary: string;
  weatherSignals?: WeatherSignal[];
  weatherFreshness?: string | null;
  generator?: JsonGenerator | null;
}): Promise<AdvisoryResult> {
  const prompt = buildAdvisoryPayload({
    contextSummary: input.contextSummary,
    engine: input.engine,
    weatherSignals: input.weatherSignals,
    weatherFreshness: input.weatherFreshness ?? null,
  });

  return generateValidated({
    generator: input.generator,
    schema: advisoryNarrativeSchema,
    systemInstruction:
      "You narrate deterministic crop-advisory output for farmers in Nashik district. Never invent numbers. Respond only with the requested JSON.",
    prompt,
  }).then((result): AdvisoryResult => {
    if (result.ok && result.data) {
      return {
        source: "ai_generated",
        narrative: result.data,
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
