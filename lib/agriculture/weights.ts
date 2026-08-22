import type { SuitabilityFactorKey } from "./results";

export type SuitabilityWeights = Record<SuitabilityFactorKey, number>;

export const DEFAULT_SUITABILITY_WEIGHTS: SuitabilityWeights = {
  soil: 0.2,
  water: 0.18,
  climate: 0.17,
  season: 0.15,
  economic: 0.15,
  resilience: 0.1,
  diseaseRisk: 0.05,
};

const EPSILON = 1e-9;

export function weightsSum(weights: SuitabilityWeights): number {
  return Object.values(weights).reduce((a, b) => a + b, 0);
}

export function validateWeights(
  weights: SuitabilityWeights,
): { valid: boolean; sum: number } {
  const sum = weightsSum(weights);
  return { valid: Math.abs(sum - 1) < 1e-6 && Object.values(weights).every((w) => w >= 0), sum };
}

export const COMPATIBILITY_SCORES = {
  excellent: 100,
  good: 80,
  moderate: 55,
  poor: 25,
  unsuitable: 0,
} as const;

export const SEVERITY_PENALTIES = {
  none: 0,
  low: 15,
  moderate: 45,
  high: 80,
} as const;

export const WATER_AVAILABILITY_INDEX = {
  rainfed: 0,
  limited: 1,
  moderate: 2,
  assured: 3,
} as const;

export const WATER_DEMAND_REQUIREMENT = {
  low: 0,
  medium: 1,
  high: 2,
} as const;

export const RISK_PENALTY_SCALE = 0.25;

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export { EPSILON };
