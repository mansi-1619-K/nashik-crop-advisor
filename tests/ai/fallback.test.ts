import { describe, expect, it } from "vitest";
import { buildAdvisoryPayload } from "@/lib/ai/prompts";
import {
  buildFallbackChatAnswer,
  buildFallbackNarrative,
} from "@/lib/ai/fallback";
import { generateRecommendations } from "@/lib/agriculture/recommend";

const engine = generateRecommendations({
  zoneId: "central-irrigated",
  seasonId: "rabi",
  soilId: "medium-black",
  waterAvailability: "assured",
}, { now: "2026-08-22T00:00:00Z" });

describe("prompt builders", () => {
  it("embeds grounding rules and engine data without any credentials", () => {
    const prompt = buildAdvisoryPayload({ contextSummary: engine.contextSummary, engine });
    expect(prompt).toMatch(/NEVER calculate/i);
    expect(prompt).toContain('"onion"');
    expect(prompt).not.toMatch(/apiKey|API_KEY|Bearer /i);
    expect(prompt).toMatch(/Respond ONLY with JSON/);
  });

  it("includes weather signals when provided", () => {
    const prompt = buildAdvisoryPayload({
      contextSummary: engine.contextSummary,
      engine,
      weatherSignals: [
        {
          type: "heat-stress",
          severity: "moderate",
          confidence: "high",
          reason: "High of 38°C forecast",
          recommendedAction: "Irrigate early",
          validUntil: "2026-08-23T23:59:59+05:30",
        },
      ],
    });
    expect(prompt).toContain("heat-stress");
    expect(prompt).toContain("38°C");
  });
});

describe("deterministic fallbacks", () => {
  it("narrates the primary recommendation from engine output only", () => {
    const narrative = buildFallbackNarrative({ engine });
    expect(narrative.summary).toContain("Onion");
    expect(narrative.summary).toContain("69/100");
    expect(narrative.recommendationExplanation.length).toBeGreaterThan(20);
    expect(narrative.actions.length).toBeGreaterThan(0);
    expect(narrative.followUpQuestions[0]).toMatch(/Why was Onion ranked first/);
  });

  it("handles the nothing-eligible case honestly", () => {
    const empty = generateRecommendations(
      { zoneId: "heavy-rainfall", seasonId: "summer", soilId: "laterite", waterAvailability: "rainfed" },
      { now: "2026-08-22T00:00:00Z" },
    );
    const narrative = buildFallbackNarrative({ engine: empty });
    expect(narrative.summary).toMatch(/no crop.*eligible/i);
  });

  it("answers why-questions from engine factors", () => {
    const answer = buildFallbackChatAnswer({ question: "Why was onion recommended?", engine });
    expect(answer.answer).toContain("#1");
    expect(answer.answer).toContain("Onion");
  });

  it("answers water questions with irrigation guidance", () => {
    const answer = buildFallbackChatAnswer({ question: "When should I irrigate?", engine });
    expect(answer.answer).toMatch(/water suitability/i);
    expect(answer.caveats.join(" ")).toMatch(/heuristic/i);
  });

  it("answers economics questions with ranges and honesty labels", () => {
    const answer = buildFallbackChatAnswer({ question: "How much profit can I make?", engine });
    expect(answer.answer).toMatch(/break-even/i);
    expect(answer.caveats.join(" ")).toMatch(/ESTIMATED|not live/i);
  });

  it("refuses out-of-scope questions instead of guessing", () => {
    const answer = buildFallbackChatAnswer({ question: "Who will win the cricket match?", engine });
    expect(answer.answer).toMatch(/cannot|only be guessing|grounded/i);
  });
});
