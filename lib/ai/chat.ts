import type { RecommendationOutput } from "@/lib/agriculture/results";
import type { WeatherSignal } from "@/lib/agriculture/weatherRisk";
import { resolveCitations } from "@/lib/rag/evidence";
import type { Citation, EvidenceBundle } from "@/lib/rag/types";
import { generateValidated, type JsonGenerator } from "./gemini";
import { buildChatPrompt } from "./prompts";
import { chatAnswerSchema, type ChatAnswer } from "./schemas";
import { buildFallbackChatAnswer } from "./fallback";

export interface ChatResult {
  source: "ai_generated" | "static";
  answer: Omit<ChatAnswer, "citationIds">;
  citations?: Citation[];
  model?: string;
  attempts?: number;
  error?: string;
}

const MAX_QUESTION_LENGTH = 500;

export function sanitizeQuestion(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_QUESTION_LENGTH) return null;
  return trimmed;
}

export function answerFarmQuestion(input: {
  question: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  engine: RecommendationOutput;
  contextSummary: string;
  weatherSignals?: WeatherSignal[];
  evidence?: EvidenceBundle;
  generator?: JsonGenerator | null;
}): Promise<ChatResult> {
  const prompt = buildChatPrompt({
    question: input.question,
    history: input.history,
    engine: input.engine,
    contextSummary: input.contextSummary,
    weatherSignals: input.weatherSignals,
    evidence: input.evidence,
  });

  return generateValidated({
    generator: input.generator,
    schema: chatAnswerSchema,
    systemInstruction:
      "You are a grounded agricultural assistant for Nashik farmers. Answer only from the provided engine snapshot and reference knowledge. Never invent numbers. Respond only with the requested JSON.",
    prompt,
    maxAttempts: 2,
  }).then((result): ChatResult => {
    if (result.ok && result.data) {
      const { citationIds, ...answer } = result.data;
      const citations = resolveCitations(
        citationIds,
        input.evidence ?? { chunks: [], citations: [], unavailable: false },
      );
      return {
        source: "ai_generated",
        answer,
        ...(citations.length > 0 ? { citations } : {}),
        model: result.model,
        attempts: result.attempts,
      };
    }
    return {
      source: "static",
      answer: buildFallbackChatAnswer({
        question: input.question,
        engine: input.engine,
        weatherSignals: input.weatherSignals,
      }),
      attempts: result.attempts,
      error: `AI chat unavailable (${result.reason ?? "unknown"}) — answered from deterministic rules.`,
    };
  });
}
