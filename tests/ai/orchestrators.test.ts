import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { narrateRecommendation } from "@/lib/ai/advisory";
import { answerFarmQuestion, sanitizeQuestion } from "@/lib/ai/chat";
import { setGeminiGenerator } from "@/lib/ai/gemini";
import { generateRecommendations } from "@/lib/agriculture/recommend";

const engine = generateRecommendations(
  {
    zoneId: "central-irrigated",
    seasonId: "rabi",
    soilId: "medium-black",
    waterAvailability: "assured",
  },
  { now: "2026-08-22T00:00:00Z" },
);

beforeEach(() => setGeminiGenerator(null));
afterEach(() => {
  setGeminiGenerator(undefined);
  vi.restoreAllMocks();
});

describe("advisory narration", () => {
  it("returns AI-generated narrative when the generator complies", async () => {
    const result = await narrateRecommendation({
      engine,
      contextSummary: engine.contextSummary,
      generator: {
        generate: async () => ({
          summary: "Onion leads for your irrigated rabi plot on medium black soil.",
          recommendationExplanation:
            "The engine scored onion highest because its soil rating is excellent and water supply is assured.",
          actions: ["Confirm seedling supply early."],
          warnings: [],
          followUpQuestions: ["What if prices drop?"],
        }),
      },
    });
    expect(result.source).toBe("ai_generated");
    expect(result.model).toBeTruthy();
    expect(result.narrative.actions[0]).toContain("seedling");
  });

  it("falls back to deterministic narration after repeated invalid output", async () => {
    const sleepSpy = vi.spyOn(globalThis, "setTimeout").mockImplementation(((fn: () => void) => {
      fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);
    try {
      const result = await narrateRecommendation({
        engine,
        contextSummary: engine.contextSummary,
        generator: { generate: async () => ({ nonsense: true }) },
      });
      expect(result.source).toBe("static");
      expect(result.error).toMatch(/AI narration unavailable/);
      expect(result.narrative.summary).toContain("Onion");
      expect(result.attempts).toBe(3);
    } finally {
      sleepSpy.mockRestore();
    }
  });

  it("falls back immediately when unconfigured", async () => {
    const result = await narrateRecommendation({ engine, contextSummary: engine.contextSummary });
    expect(result.source).toBe("static");
    expect(result.error).toMatch(/not-configured/);
  });
});

describe("farm chat", () => {
  it("sanitizes questions", () => {
    expect(sanitizeQuestion("  why onion?  ")).toBe("why onion?");
    expect(sanitizeQuestion("")).toBeNull();
    expect(sanitizeQuestion(42)).toBeNull();
    expect(sanitizeQuestion("x".repeat(501))).toBeNull();
  });

  it("answers via the generator when valid", async () => {
    const result = await answerFarmQuestion({
      question: "Why onion first?",
      engine,
      contextSummary: engine.contextSummary,
      generator: {
        generate: async () => ({
          answer: "Onion ranks first due to excellent soil compatibility and assured water.",
          caveats: ["Scores use assumed data."],
          suggestedFollowUps: ["What about grapes?"],
        }),
      },
    });
    expect(result.source).toBe("ai_generated");
    expect(result.answer.caveats.length).toBe(1);
  });

  it("falls back to grounded rules when the model fails", async () => {
    const result = await answerFarmQuestion({
      question: "What risks should I watch this week?",
      engine,
      contextSummary: engine.contextSummary,
      generator: {
        generate: async () => {
          throw new Error("boom");
        },
      },
    });
    expect(result.source).toBe("static");
    expect(result.answer.answer.toLowerCase()).toMatch(/watch|risk|no elevated/);
  });
});
