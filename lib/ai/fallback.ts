import type { AdvisoryNarrative, ChatAnswer } from "./schemas";
import type { RecommendationOutput } from "@/lib/agriculture/results";
import type { WeatherSignal } from "@/lib/agriculture/weatherRisk";

export function buildFallbackNarrative(input: {
  engine: RecommendationOutput;
  weatherSignals?: WeatherSignal[];
}): AdvisoryNarrative {
  const { engine, weatherSignals = [] } = input;
  const primary = engine.primary;

  if (!primary) {
    return {
      summary:
        "No crop in the knowledge base is eligible under this combination of zone, season, soil and water constraints.",
      recommendationExplanation:
        "The deterministic engine excluded every candidate due to hard agronomic constraints. Adjust the farm context — for example the season, soil or water availability — and run the analysis again.",
      actions: ["Review the exclusion reasons listed under the recommendations."],
      warnings: [],
      followUpQuestions: [
        "Which constraint blocked most crops?",
        "What context combinations do support paddy?",
      ],
    };
  }

  const name = cropDisplayName(primary.cropId);
  const topFactors = primary.whyRecommended.slice(0, 2);
  const weakFactors = primary.suitability.factors
    .filter((f) => f.impact === "negative")
    .slice(0, 2);

  const actions: string[] = [];
  if (primary.economics) {
    actions.push(
      `Compare your expected sale price against the break-even range of ₹${primary.economics.breakEvenPricePerQuintalInr.min}–₹${primary.economics.breakEvenPricePerQuintalInr.max} per quintal before committing.`,
    );
  }
  for (const weak of weakFactors) {
    actions.push(`Pay attention to ${weak.label.toLowerCase()}: ${weak.reason}`);
  }
  if (engine.resilientAlternative) {
    actions.push(
      `Consider ${cropDisplayName(engine.resilientAlternative.cropId)} as a lower-risk alternative if conditions deteriorate.`,
    );
  }

  const warnings = [...primary.warnings];
  for (const signal of weatherSignals.filter((s) => s.severity !== "low").slice(0, 3)) {
    warnings.push(`${signal.type.replace(/-/g, " ")}: ${signal.reason}`);
  }

  return {
    summary: `${name} leads with a suitability score of ${primary.suitability.overallScore}/100 (confidence: ${primary.confidence.level}) for ${engine.contextSummary}. ${
      engine.secondary ? `${cropDisplayName(engine.secondary.cropId)} ranks second.` : ""
    }`.trim(),
    recommendationExplanation: [
      `The engine ranked ${name} first because: ${topFactors.join(" ")}`,
      engine.secondary
        ? `${cropDisplayName(engine.secondary.cropId)} scored lower mainly on factors where it trails the leader.`
        : "",
    ]
      .filter(Boolean)
      .join(" "),
    actions: actions.length > 0 ? actions.slice(0, 5) : ["Validate local market prices before sowing."],
    warnings,
    followUpQuestions: [
      `Why was ${name} ranked first?`,
      "What happens if prices fall 15%?",
      "What should I watch this week?",
    ],
  };
}

const CROP_NAMES: Record<string, string> = {
  paddy: "Paddy",
  "finger-millet": "Finger Millet",
  "little-millet": "Little Millet",
  grape: "Table Grape",
  onion: "Onion",
  tomato: "Tomato",
  pomegranate: "Pomegranate",
  guava: "Guava",
  "pearl-millet": "Pearl Millet",
  soybean: "Soybean",
  "pigeon-pea": "Pigeon Pea",
};

export function cropDisplayName(id: string): string {
  return CROP_NAMES[id] ?? id;
}

export function buildFallbackChatAnswer(input: {
  question: string;
  engine: RecommendationOutput;
  weatherSignals?: WeatherSignal[];
}): ChatAnswer {
  const { engine, question, weatherSignals = [] } = input;
  const primary = engine.primary;
  const q = question.toLowerCase();

  if (!primary) {
    return {
      answer:
        "No eligible crops exist for the current context, so I cannot compare options. The exclusion list on the dashboard shows exactly which constraints blocked each crop.",
      caveats: [],
      suggestedFollowUps: ["Which constraint blocked most crops?"],
    };
  }

  if (/why.*(recommend|rank|first|top)|how.*decid/.test(q)) {
    return {
      answer: `${cropDisplayName(primary.cropId)} is ranked #1 with ${primary.suitability.overallScore}/100 because: ${primary.whyRecommended.join(" ")}`,
      caveats: ["Scores come from assumed dataset parameters pending ICAR validation."],
      suggestedFollowUps: [`How does ${cropDisplayName(engine.secondary?.cropId ?? "")} compare?`, "What happens if prices fall 15%?"],
    };
  }

  if (/irrigat|water/.test(q)) {
    const waterFactor = primary.suitability.factors.find((f) => f.key === "water");
    const irrigationSignal = weatherSignals.find((s) => s.type === "irrigation-opportunity");
    const rainSignal = weatherSignals.find((s) => s.type === "excessive-rainfall");
    const parts = [
      waterFactor ? `${cropDisplayName(primary.cropId)}'s water suitability here scores ${waterFactor.score}/100 — ${waterFactor.reason}` : null,
      rainSignal ? `Note: ${rainSignal.reason} — ${rainSignal.recommendedAction}` : irrigationSignal ? `${irrigationSignal.reason}. ${irrigationSignal.recommendedAction}` : null,
    ].filter(Boolean);
    return {
      answer: parts.join(" ") || "Water guidance needs live weather data, which is currently unavailable.",
      caveats: ["Heuristic advisory based on forecast, not a site measurement."],
      suggestedFollowUps: ["What are this week's weather risks?"],
    };
  }

  if (/risk|disease|pest|alert|watch/.test(q)) {
    const items = [
      ...primary.warnings.map((w) => `• ${w}`),
      ...weatherSignals
        .filter((s) => s.severity !== "low")
        .slice(0, 3)
        .map((s) => `• ${s.type.replace(/-/g, " ")} (${s.severity}): ${s.reason}`),
    ];
    return {
      answer: items.length > 0 ? `Things to watch for ${cropDisplayName(primary.cropId)}:\n${items.join("\n")}` : `No elevated risk signals for ${cropDisplayName(primary.cropId)} right now beyond routine monitoring.`,
      caveats: ["These are heuristic advisories, not disease diagnoses."],
      suggestedFollowUps: ["When should I irrigate?"],
    };
  }

  if (/price|profit|income|cost|earn|money|econ/.test(q) && primary.economics) {
    const e = primary.economics;
    return {
      answer: `Estimated per-acre economics for ${cropDisplayName(primary.cropId)}: net return ₹${e.netReturnPerAcreInr.min.toLocaleString("en-IN")}–₹${e.netReturnPerAcreInr.max.toLocaleString("en-IN")} against an input cost of ₹${e.inputCostPerAcreInr.min.toLocaleString("en-IN")}–₹${e.inputCostPerAcreInr.max.toLocaleString("en-IN")}. Break-even sits at ₹${e.breakEvenPricePerQuintalInr.min}–₹${e.breakEvenPricePerQuintalInr.max} per quintal.`,
      caveats: ["All figures are ESTIMATED from assumed dataset ranges; sample prices are not live."],
      suggestedFollowUps: ["What happens if prices fall 15%?", "Why was this crop recommended?"],
    };
  }

  return {
    answer: `I can answer questions grounded in the current analysis — for example why ${cropDisplayName(primary.cropId)} ranks first, water and irrigation timing, this week's risk advisories, or expected economics. For anything outside this data I would only be guessing, so I will not answer without grounding.`,
    caveats: ["Answers must stay grounded in engine output."],
    suggestedFollowUps: ["Why was this crop recommended first?", "What should I watch this week?"],
  };
}
