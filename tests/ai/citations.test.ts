import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { narrateRecommendation } from "@/lib/ai/advisory";
import { answerFarmQuestion } from "@/lib/ai/chat";
import { setGeminiGenerator } from "@/lib/ai/gemini";
import { buildChatPrompt } from "@/lib/ai/prompts";
import { generateRecommendations } from "@/lib/agriculture/recommend";
import { getEvidenceRetriever } from "@/lib/rag/retrieve";

const engine = generateRecommendations(
  {
    zoneId: "central-irrigated",
    seasonId: "rabi",
    soilId: "medium-black",
    waterAvailability: "assured",
  },
  { now: "2026-08-22T00:00:00Z" },
);

const evidence = getEvidenceRetriever().retrieve("onion storage curing ventilation", { topK: 2 });

beforeEach(() => {
  setGeminiGenerator(null);
});

afterEach(() => {
  setGeminiGenerator(undefined);
  vi.restoreAllMocks();
});

describe("evidence-aware prompts", () => {
  it("embeds reference passages with credibility labels and citation rules", () => {
    const prompt = buildChatPrompt({
      question: "How do I store onions?",
      engine,
      contextSummary: engine.contextSummary,
      evidence,
    });
    expect(prompt).toContain("REFERENCE KNOWLEDGE");
    expect(prompt).toContain("(internal)");
    expect(prompt).toContain("Cite ONLY ids that appear above");
    for (const chunk of evidence.chunks) {
      expect(prompt).toContain(`[${chunk.id}]`);
    }
  });

  it("omits the evidence block when no bundle is provided", () => {
    const prompt = buildChatPrompt({
      question: "Why onion?",
      engine,
      contextSummary: engine.contextSummary,
    });
    expect(prompt).not.toContain("REFERENCE KNOWLEDGE");
    expect(prompt).toContain('"citationIds": []');
  });

  it("keeps prompts free of credential material", () => {
    const prompt = buildChatPrompt({
      question: "onion storage",
      engine,
      contextSummary: engine.contextSummary,
      evidence,
    });
    expect(prompt.toLowerCase()).not.toMatch(/api[_-]?key|secret|password|bearer\s/);
  });
});

describe("citation resolution in orchestrators", () => {
  it("maps cited ids to citation objects and strips raw ids from answers", async () => {
    const result = await answerFarmQuestion({
      question: "How should I store onions?",
      engine,
      contextSummary: engine.contextSummary,
      evidence,
      generator: {
        generate: async () => ({
          answer: `Cure in shade and store with airflow. Reference: [${evidence.chunks[0].id}].`,
          caveats: [],
          suggestedFollowUps: [],
          citationIds: [evidence.chunks[0].id],
        }),
      },
    });
    expect(result.source).toBe("ai_generated");
    expect(result.citations?.[0]?.documentId).toBe(evidence.chunks[0].documentId);
    expect(result.citations?.[0]?.credibility).toBe("internal");
    expect((result.answer as Record<string, unknown>).citationIds).toBeUndefined();
  });

  it("drops invented citation ids instead of surfacing them", async () => {
    const result = await answerFarmQuestion({
      question: "Why onion first?",
      engine,
      contextSummary: engine.contextSummary,
      evidence,
      generator: {
        generate: async () => ({
          answer: "Onion ranks first on soil and water factors.",
          caveats: [],
          suggestedFollowUps: [],
          citationIds: ["fabricated-doc#99", evidence.chunks[0]?.id ?? ""].filter(Boolean),
        }),
      },
    });
    expect(result.citations).toHaveLength(1);
    expect(result.citations?.[0]?.chunkId).toBe(evidence.chunks[0].id);
  });

  it("returns no citations when the model omits them", async () => {
    const result = await answerFarmQuestion({
      question: "Why onion first?",
      engine,
      contextSummary: engine.contextSummary,
      evidence,
      generator: {
        generate: async () => ({
          answer: "Onion ranks first due to excellent soil compatibility.",
          caveats: [],
          suggestedFollowUps: [],
        }),
      },
    });
    expect(result.citations).toBeUndefined();
  });

  it("attaches no citations to static fallbacks beyond resolved ids (none exist)", async () => {
    const result = await narrateRecommendation({
      engine,
      contextSummary: engine.contextSummary,
      evidence,
    });
    expect(result.source).toBe("static");
    expect(result.narrative.summary.length).toBeGreaterThan(0);
    expect(result.citations).toBeUndefined();
  });
});
