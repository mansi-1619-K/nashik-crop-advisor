# Decision Engine

> Status: **implemented (Phases 1–3)** · Version `1.0.0` (`ENGINE_VERSION` in
> `lib/agriculture/recommend.ts`) · Sensitivity analysis: implemented (Phase 3).

## Purpose

Specify the deterministic constraint + suitability + recommendation pipeline that
never depends on any LLM and must run with `GEMINI_API_KEY` absent.

## Pipeline

```
FarmerContext (Zod-validated)
→ per-crop hard constraints        lib/agriculture/constraints.ts
→ suitability scoring (eligible)   lib/agriculture/suitability.ts
→ ranking + role assignment        lib/agriculture/recommend.ts
→ confidence assessment            lib/agriculture/confidence.ts
→ RecommendationOutput             lib/agriculture/results.ts
```

Deterministic guarantees: identical inputs (with fixed `now`) produce byte-identical
output; no network calls; no randomness.

## Hard agronomic constraints

A crop is **eligible** only with zero violations. Violations are machine-readable
(`code`, `factor`, `message`).

| Code | Fires when |
| --- | --- |
| `zone-out-of-range` | crop's zone list excludes the context zone |
| `season-incompatible` | crop's seasons exclude the context season |
| `water-incompatible` | availability index < demand requirement (see below) |
| `soil-severely-incompatible` | soil compatibility rating is `unsuitable` |
| `climate-severely-incompatible` | zero rainfall-window overlap **and farm is rainfed** |

Warnings (non-blocking): `water-borderline` (exact-margin water match, or monsoon
substitution), `soil-borderline` (unmapped soil), `climate-borderline`
(partial coverage <50%, or irrigation-dependent fit).

### Water model

Availability index: `rainfed 0 < limited 1 < moderate 2 < assured 3`.
Demand requirement: `low 0, medium 1, high 2`.

**Monsoon substitution exception:** rainfed farms in belts whose annual-rainfall
band minimum is ≥900 mm may grow high-demand crops during *kharif* — recorded as a
warning ("success depends on timely rains") instead of a violation.

### Climate model (static, pre-weather-API)

Compares the crop's rainfall window against the zone's annual band:

- Zero overlap + **rainfed** → violation.
- Zero overlap + **any irrigation** → warning only (irrigation decouples the farm
  from rainfall extremes; the crop then relies entirely on irrigation).
- Coverage `<overlap> ÷ <crop range span>` below 0.5 → borderline warning.

Coverage also drives the climate *factor score* below. Known approximation:
crop windows are annual-equivalents of zone bands; recalibration against IMD
normals is a documented Phase 2+ task.

## Suitability scoring

```
overallScore = clamp(0, 100, round( Σᵢ factorScoreᵢ × weightᵢ  −  riskPenalty ))
```

Default weights (`lib/agriculture/weights.ts`, runtime-validated to sum to 1):

| Factor | Weight |
| --- | --- |
| Soil compatibility | 0.20 |
| Water suitability | 0.18 |
| Climate fit | 0.17 |
| Season alignment | 0.15 |
| Economic potential | 0.15 |
| Resilience | 0.10 |
| Disease risk | 0.05 |

Factor definitions (all 0–100):

| Factor | Rule |
| --- | --- |
| Soil | excellent 100 · good 80 · moderate 55 · poor 25 · unsuitable 0; unmapped → moderate + caution reason |
| Water | surplus = availIdx − reqIdx → base 100 / 88 / 72 / 45 (surplus ≥2 / 1 / 0 / negative); monsoon substitution lifts rainfed to limited; blended `0.65·base + 0.35·droughtTolerance` when effective availability ≤ limited |
| Climate | coverage ratio of crop rainfall window inside zone band ×100 |
| Season | base 90, +10 if season rainfed-viability is high; −50 rainfed+low viability, −25 rainfed+medium, −30 limited+low |
| Economic | ROI% = (midYield×midPrice − midCost) ÷ midCost; ≤0% → 5, linear to 100 at 200% ROI |
| Resilience | 0.6·droughtTolerance + 0.4·floodTolerance |
| Disease risk | 100 − mean(severity penalty); penalties none 0 · low 15 · moderate 45 · high 80 |

`riskPenalty = meanSeverityPenalty × 0.25` (max 20 points), applied after the
weighted sum. Factor impact labels: positive ≥75, negative <50, else neutral.
Every factor carries a generated natural-language `reason` citing its inputs.

## Ranking, roles & rejection

- Sort: overallScore desc → resilience desc → cropId asc (total determinism).
- Roles: rank 1 = `primary`, rank 2 = `secondary`; among ranks ≥3 the highest-
  resilience candidate becomes `resilient-alternative` if its resilience ≥40 and
  ≥ the primary's.
- Ineligible crops are returned in `rejected[]` with their violations so the UI can
  explain exclusions.

## Confidence metric

Starts at 100; deductions:

| Condition | Deduction |
| --- | --- |
| Crop dataset quality `assumed` | −30 |
| No live weather data | −10 |
| Market data sample/absent | −15 |
| Per-crop advisory warnings | −5 each (max −15) |
| Top-two score separation < 8 points | −12 |

Levels: ≥75 `high`, ≥55 `medium`, else `low`. Under Phase-1 data quality the
engine honestly reports **low-to-medium** confidence — this is intended behaviour,
not a bug.

## Explainability contract

- `whyRecommended`: up to three highest positive-contribution factor reasons.
- `whyRankedLower` (alternatives): every factor where the primary outscores the
  candidate by ≥8 points, worst deficit first.
- `warnings`: human-readable constraint warnings.
- `economics`: range-based estimate (min/max) over dataset economics, always
  labelled `estimated`.

## Sensitivity analysis (`lib/agriculture/sensitivity.ts`, Phase 3)

Scenarios are **input projections**, not engine forks:

| Override | Effect |
| --- | --- |
| `rainfallScale` | scales the zone annual-rainfall band before constraint/climate checks |
| `waterOverride` | substitutes water availability (one-level downgrade preset) |
| `priceFactor` / `costFactor` / `yieldFactor` | scale the crop's economics ranges |

Default stress set: Base · Rainfall −20% · −40% · Price −15% · Cost +10% · Water ↓1.
Each scenario re-runs the full pipeline and reports top-5 ranking, primary score,
mid net return, resilience, risk penalty, plus deltas vs base and the base pick's
new rank. `stableScenarioCount` records how often the base recommendation survives
as #1. Exposed via `POST /api/simulate`.

## Standing invariant

Gemini (Phase 4+) receives this output as structured context and may phrase it,
but can never override constraints, scores, rankings or confidence.
