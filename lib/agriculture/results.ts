import type { ConfidenceLevel, Range } from "@/lib/types/common";

export type ConstraintFactor = "season" | "water" | "soil" | "climate" | "zone";

export type ConstraintCode =
  | "season-incompatible"
  | "water-incompatible"
  | "soil-severely-incompatible"
  | "climate-severely-incompatible"
  | "zone-out-of-range"
  | "water-borderline"
  | "soil-borderline"
  | "climate-borderline"
  | "economics-low-confidence";

export interface ConstraintMessage {
  code: ConstraintCode;
  factor: ConstraintFactor;
  message: string;
}

export interface ConstraintResult {
  eligible: boolean;
  violations: ConstraintMessage[];
  warnings: ConstraintMessage[];
}

export type SuitabilityFactorKey =
  | "soil"
  | "water"
  | "climate"
  | "season"
  | "economic"
  | "resilience"
  | "diseaseRisk";

export type FactorImpact = "positive" | "neutral" | "negative";

export interface FactorScore {
  key: SuitabilityFactorKey;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  impact: FactorImpact;
  reason: string;
}

export interface SuitabilityResult {
  cropId: string;
  overallScore: number;
  factors: FactorScore[];
  riskPenalty: number;
}

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  score: number;
  reasons: string[];
}

export interface EconomicEstimate {
  valueClass: "estimated";
  currency: "INR";
  basis: string;
  inputCostPerAcreInr: Range;
  grossRevenuePerAcreInr: Range;
  netReturnPerAcreInr: Range;
  breakEvenPricePerQuintalInr: Range;
  roiPercent: Range;
}

export type RecommendationRole = "primary" | "secondary" | "resilient-alternative";

export interface Recommendation {
  role: RecommendationRole;
  rank: number;
  cropId: string;
  suitability: SuitabilityResult;
  constraints: ConstraintResult;
  confidence: ConfidenceAssessment;
  economics: EconomicEstimate | null;
  whyRecommended: string[];
  whyRankedLower: string[];
  warnings: string[];
}

export interface RecommendationOutput {
  engineVersion: string;
  generatedAt: string;
  contextSummary: string;
  weightsUsed: Record<string, number>;
  /** Full eligible ranking (best first), exposed for evaluation and analysis. */
  ranked: Array<{ cropId: string; overallScore: number }>;
  primary: Recommendation | null;
  secondary: Recommendation | null;
  resilientAlternative: Recommendation | null;
  rejected: Array<{ cropId: string; violations: ConstraintMessage[] }>;
}
