import type { ConfidenceAssessment } from "./results";

export interface ConfidenceInputs {
  datasetQuality: "assumed" | "curated" | "sample";
  warningsCount: number;
  topScore: number | null;
  runnerUpScore: number | null;
  hasLiveWeather: boolean;
  marketDataClass: "live" | "sample" | "none";
}

export function assessConfidence(inputs: ConfidenceInputs): ConfidenceAssessment {
  let score = 100;
  const reasons: string[] = [];

  if (inputs.datasetQuality === "assumed") {
    score -= 30;
    reasons.push(
      "Agronomic parameters are unvalidated initial assumptions (dataset quality: assumed).",
    );
  }

  if (!inputs.hasLiveWeather) {
    score -= 10;
    reasons.push("No live weather data available yet; climate factors use static zone bands.");
  }

  if (inputs.marketDataClass !== "live") {
    score -= 15;
    reasons.push("Market inputs are sample/absent, not live prices.");
  }

  if (inputs.warningsCount > 0) {
    const deduction = Math.min(15, inputs.warningsCount * 5);
    score -= deduction;
    reasons.push(`${inputs.warningsCount} advisory warning(s) on this crop (-${deduction}).`);
  }

  if (
    inputs.topScore !== null &&
    inputs.runnerUpScore !== null &&
    inputs.topScore - inputs.runnerUpScore < 8
  ) {
    score -= 12;
    reasons.push("Top two candidates are close in score; ranking is sensitive to assumptions.");
  }

  if (inputs.topScore === null) {
    return { level: "low", score: 0, reasons: ["No eligible crops for this context."] };
  }

  score = Math.max(0, Math.min(100, score));
  const level = score >= 75 ? "high" : score >= 55 ? "medium" : "low";
  if (reasons.length === 0) {
    reasons.push("Clean constraints, curated data, live weather and market data all present.");
  }
  return { level, score, reasons };
}
