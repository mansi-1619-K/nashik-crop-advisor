import type { RecommendationOutput } from "@/lib/agriculture/results";
import type { WeatherSignal } from "@/lib/agriculture/weatherRisk";
import type { EvidenceBundle } from "@/lib/rag/types";

const GROUNDING_RULES = `You are the narration layer of a DETERMINISTIC crop advisory system for Nashik district, Maharashtra, India.

ABSOLUTE RULES:
1. All numbers, rankings, scores and constraints are ALREADY COMPUTED by a deterministic engine and are provided to you as JSON. You must NEVER calculate, estimate, invent or alter any number, score, ranking or constraint outcome.
2. Use ONLY the data in the provided payload. If something is not in the payload, say you do not have that information.
3. Never override, soften or reinterpret hard constraints (e.g., never suggest an excluded crop is actually fine).
4. Respect the source labels: values marked ESTIMATED/ASSUMED/HEURISTIC/SAMPLE are not measurements. Never present them as guarantees.
5. Weather-related statements are heuristic advisories, never diagnoses ("conditions favor pressure", NOT "your crop has disease").
6. Write for a farmer: simple sentences, practical language, no jargon without explanation.
7. Respond ONLY with a single JSON object matching the requested schema — no markdown fences, no commentary.`;

export function renderEvidenceBlock(evidence?: EvidenceBundle): string {
  if (!evidence || evidence.unavailable || evidence.chunks.length === 0) return "";
  const lines = evidence.chunks.map(
    (c) => `[${c.id}] (${c.credibility}) ${c.text}`,
  );
  return `\nREFERENCE KNOWLEDGE (optional background; credibility tier shown per passage — 'internal' means an editorial summary pending expert validation):
${lines.join("\n")}
When a passage above genuinely supports part of your answer, list its id in "citationIds". Cite ONLY ids that appear above — never invent or reuse unrelated ids.`;
}

function evidenceCitationInstruction(evidence?: EvidenceBundle): string {
  const hasEvidence = Boolean(
    evidence && !evidence.unavailable && evidence.chunks.length > 0,
  );
  return hasEvidence
    ? '"citationIds": string[] (max 4 — only reference-knowledge passage ids that directly support your statements; omit when none apply)'
    : '"citationIds": [] (no reference knowledge was provided)';
}

export interface AdvisoryPayloadInput {
  contextSummary: string;
  engine: RecommendationOutput;
  weatherSignals?: WeatherSignal[];
  weatherFreshness?: string | null;
  evidence?: EvidenceBundle;
}

export function buildAdvisoryPayload(input: AdvisoryPayloadInput): string {
  const { engine, weatherSignals } = input;
  const primary = engine.primary;
  const compact = {
    farmContext: input.contextSummary,
    weatherNote: input.weatherFreshness
      ? `weather freshness: ${input.weatherFreshness}`
      : "no live weather available",
    primaryRecommendation: primary
      ? {
          cropId: primary.cropId,
          rank: primary.rank,
          overallScore: primary.suitability.overallScore,
          confidence: primary.confidence,
          factorScores: primary.suitability.factors.map((f) => ({
            key: f.key,
            label: f.label,
            score: f.score,
            impact: f.impact,
            reason: f.reason,
          })),
          riskPenalty: primary.suitability.riskPenalty,
          economicsEstimated: primary.economics,
          whyRecommendedByEngine: primary.whyRecommended,
          warningsFromEngine: primary.warnings,
        }
      : null,
    secondaryCropId: engine.secondary?.cropId ?? null,
    resilientAlternativeCropId: engine.resilientAlternative?.cropId ?? null,
    rejectedCrops: engine.rejected.map((r) => ({
      cropId: r.cropId,
      reasons: r.violations.map((v) => v.message),
    })),
    weatherSignals: weatherSignals ?? [],
  };
  return `${GROUNDING_RULES}
${renderEvidenceBlock(input.evidence)}

ENGINE OUTPUT (the only source of truth):
${JSON.stringify(compact, null, 2)}

TASK: Produce a farmer-friendly advisory narration of this output.
Respond ONLY with JSON of shape:
{"summary": string (2-4 sentences), "recommendationExplanation": string (why the top crop wins, citing engine factors and scores; mention alternatives briefly), "actions": string[] (max 6 concrete next steps grounded in the data), "warnings": string[] (engine warnings + relevant weather advisories, max 6), "followUpQuestions": string[] (max 4 questions the farmer might ask next), ${evidenceCitationInstruction(input.evidence)}}`;
}

export interface ChatPayloadInput {
  question: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  engine: RecommendationOutput;
  contextSummary: string;
  weatherSignals?: WeatherSignal[];
  evidence?: EvidenceBundle;
}

export function buildChatPrompt(input: ChatPayloadInput): string {
  const primary = input.engine.primary;
  const compact = {
    farmContext: input.contextSummary,
    topRecommendation: primary
      ? {
          cropId: primary.cropId,
          overallScore: primary.suitability.overallScore,
          confidence: primary.confidence.level,
          topFactors: primary.suitability.factors
            .filter((f) => f.impact === "positive")
            .slice(0, 3)
            .map((f) => ({ label: f.label, score: f.score, reason: f.reason })),
          weakFactors: primary.suitability.factors
            .filter((f) => f.impact === "negative")
            .map((f) => ({ label: f.label, score: f.score, reason: f.reason })),
          economicsEstimated: primary.economics,
          warnings: primary.warnings,
        }
      : null,
    secondaryCropId: input.engine.secondary?.cropId ?? null,
    resilientAlternativeCropId: input.engine.resilientAlternative?.cropId ?? null,
    rejectedCount: input.engine.rejected.length,
    weatherSignals: input.weatherSignals ?? [],
  };

  const historyText =
    input.history && input.history.length > 0
      ? `\nCONVERSATION SO FAR:\n${input.history
          .slice(-6)
          .map((m) => `${m.role === "user" ? "FARMER" : "ADVISOR"}: ${m.content}`)
          .join("\n")}\n`
      : "";

  return `${GROUNDING_RULES}
${renderEvidenceBlock(input.evidence)}

FARM CONTEXT SNAPSHOT:
${JSON.stringify(compact, null, 2)}
${historyText}
THE FARMER ASKS: "${input.question}"

TASK: Answer using ONLY the snapshot above, prior conversation and any reference knowledge. If the answer is not derivable from them, say plainly what you cannot determine. Keep it under 180 words.
Respond ONLY with JSON of shape:
{"answer": string, "caveats": string[] (max 3, e.g. which figures are estimates), "suggestedFollowUps": string[] (max 3), ${evidenceCitationInstruction(input.evidence)}}`;
}
