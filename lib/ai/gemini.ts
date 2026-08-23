import { GoogleGenAI } from "@google/genai";
import type { ThinkingLevel } from "@google/genai";
import type { ZodType } from "zod";

export interface GenerationRequest {
  systemInstruction: string;
  prompt: string;
}

export interface JsonGenerator {
  generate(request: GenerationRequest): Promise<unknown>;
}

export class GeneratorUnavailableError extends Error {
  constructor(message = "No AI generator is configured.") {
    super(message);
    this.name = "GeneratorUnavailableError";
  }
}

export class GeneratorTransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeneratorTransientError";
  }
}

export class GeneratorPermanentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeneratorPermanentError";
  }
}

const DEFAULT_MODEL = "gemini-3.6-flash";

/**
 * Thinking-depth control. The narration task is grounded and structured, so a
 * shallow reasoning pass keeps p50 latency near-instant (measured ~2s vs ~20s).
 * Set GEMINI_THINKING=high for deeper phrasing at measured cost;
 * GEMINI_THINKING=default defers to the model's own behaviour.
 */
function resolveThinkingConfig(): { thinkingConfig?: { thinkingLevel: ThinkingLevel } } {
  const level = process.env.GEMINI_THINKING?.trim().toLowerCase();
  if (!level || level === "low") return { thinkingConfig: { thinkingLevel: "LOW" as ThinkingLevel } };
  if (level === "high") return { thinkingConfig: { thinkingLevel: "HIGH" as ThinkingLevel } };
  return {};
}

class GeminiJsonGenerator implements JsonGenerator {
  private client: GoogleGenAI | null = null;

  constructor(private readonly apiKey: string) {}

  private getClient(): GoogleGenAI {
    this.client ??= new GoogleGenAI({ apiKey: this.apiKey });
    return this.client;
  }

  async generate(request: GenerationRequest): Promise<unknown> {
    let text: string | undefined;
    try {
      const response = await this.getClient().models.generateContent({
        model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
        contents: request.prompt,
        config: {
          systemInstruction: request.systemInstruction,
          temperature: 0.4,
          responseMimeType: "application/json",
          ...resolveThinkingConfig(),
        },
      });
      text = response.text;
    } catch (error) {
      throw classifySdkError(error);
    }

    if (!text || text.trim().length === 0) {
      throw new GeneratorTransientError("Gemini returned an empty response.");
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new GeneratorTransientError("Gemini returned non-JSON content.");
    }
  }
}

function classifySdkError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: unknown }).status)
      : undefined;
  if (status === 400 || status === 401 || status === 403) {
    return new GeneratorPermanentError(`Gemini rejected the request (${message})`);
  }
  if (
    status === 429 ||
    status === 500 ||
    status === 503 ||
    /429|RESOURCE_EXHAUSTED|UNAVAILABLE|deadline|timeout|ECONN|fetch failed/i.test(message)
  ) {
    return new GeneratorTransientError(`Gemini transient failure (${message})`);
  }
  return new GeneratorPermanentError(`Gemini call failed (${message})`);
}

let cached: JsonGenerator | null | undefined;

export function getGeminiGenerator(): JsonGenerator | null {
  cached ??= process.env.GEMINI_API_KEY?.trim()
    ? new GeminiJsonGenerator(process.env.GEMINI_API_KEY.trim())
    : null;
  return cached;
}

export function setGeminiGenerator(generator: JsonGenerator | null | undefined): void {
  cached = generator;
}

export function isGeminiConfigured(): boolean {
  return getGeminiGenerator() !== null;
}

export function currentModelLabel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export interface ValidatedGenerationResult<T> {
  ok: boolean;
  data: T | null;
  attempts: number;
  reason?: string;
  model: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function extractJson(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return raw;
      }
    }
    return raw;
  }
}

export async function generateValidated<T>(args: {
  generator?: JsonGenerator | null;
  schema: ZodType<T>;
  systemInstruction: string;
  prompt: string;
  maxAttempts?: number;
}): Promise<ValidatedGenerationResult<T>> {
  const generator = args.generator === undefined ? getGeminiGenerator() : args.generator;
  const model = currentModelLabel();
  const maxAttempts = Math.max(1, args.maxAttempts ?? 3);
  let lastReason = "unknown";

  if (!generator) {
    return { ok: false, data: null, attempts: 0, reason: "not-configured", model };
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await generator.generate({
        systemInstruction: args.systemInstruction,
        prompt: args.prompt,
      });
      const parsed = args.schema.safeParse(extractJson(raw));
      if (parsed.success) {
        return { ok: true, data: parsed.data, attempts: attempt, model };
      }
      lastReason = `schema-validation: ${parsed.error.issues
        .slice(0, 2)
        .map((i) => `${i.path.join(".") || "root"} ${i.message}`)
        .join("; ")}`;
    } catch (error) {
      if (error instanceof GeneratorPermanentError) {
        return { ok: false, data: null, attempts: attempt, reason: error.message, model };
      }
      lastReason = error instanceof Error ? error.message : String(error);
    }
    if (attempt < maxAttempts) await sleep(250 * attempt);
  }

  return { ok: false, data: null, attempts: maxAttempts, reason: lastReason, model };
}
