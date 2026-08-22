# PHASE 3 REPORT — Explainability + Sensitivity

**Date:** 2026-08-22 · **Status:** ✅ Complete · **All gates passed**

## Objective

Make the engine's reasoning fully visible and stress-testable: confidence that
responds to real data availability, factor-level explainability in the UI, a
sensitivity analysis engine, the What-If Farm Simulator, and the dashboard coming
alive end-to-end.

## Delivered

### 1. Sensitivity engine (`lib/agriculture/sensitivity.ts`)
- Scenario transforms as pure object projections (scaled zone band / scaled crop
  economics / water override) — **zero changes to engine internals**, so base and
  scenarios run through identical tested code paths.
- Default stress set per brief: Base · Rainfall −20% · −40% · Market price −15% ·
  Input cost +10% · Water one level lower; custom scenario lists supported.
- Per-scenario output: top ranking (top 5), primary score, mid net return,
  resilience, risk penalty — plus deltas vs base (score Δ, profit Δ, resilience Δ)
  and where the BASE pick re-ranks.
- Ranking-stability metric: `stableScenarioCount/totalScenarios` surfaced honestly.

### 2. Live weather → confidence wiring
`POST /api/recommend` now best-effort fetches weather for the selected taluka
(4 s timeout) and feeds `weatherAvailable` into the confidence metric — confidence
score rises +10 when live data is present (verified live: 45 → 50 for Niphad).

### 3. What-If Farm Simulator UI (`components/simulator/what-if-simulator.tsx`)
- Sliders for rainfall, market price, input costs, expected yield (±%) + water
  availability selector.
- **BASE vs SCENARIO** panel: top-crop change, Score Δ, Profit Δ (₹/acre),
  Resilience Δ, and where the base recommendation lands.
- Stress-preset table + Recharts bar chart comparing top-crop scores across all
  default scenarios (base highlighted).

### 4. Dashboard comes alive (`components/dashboard/workspace.tsx` + cards)
- Context selects (zone/taluka/season/soil/water) drive `POST /api/recommend`;
  five predefined demo presets one click away.
- Weather strip with LIVE/CACHED/STALE provenance badge + advisory signals
  colour-coded by severity, explicitly tagged "heuristic".
- Primary/alternative/resilient cards: score bars, confidence badge + reasons,
  estimated economics (net-return range, break-even, ROI), why-recommended
  bullets, warnings, and full 7-factor contribution bars with impact tones.
- "Why other crops were excluded" list showing every rejection's exact violation.
- Honest empty/loading/error states throughout; upcoming modules stay labelled.

## Verification gate

| Check | Result |
| --- | --- |
| `npm test` | ✅ **102/102** (19 new: sensitivity 11, simulate API 5, recommend API rework incl. weather-aware cases) |
| typecheck / lint / build | ✅ clean (`/api/simulate` added) |
| Live UI smoke | ✅ SSR renders workspace; analyze flow hits all three APIs |
| Live simulate smoke | ✅ onion stable 5/5; price −15% → profit −₹47,250/acre; cost +10% → −₹4,000 |
| Live weather-confidence smoke | ✅ `weatherAvailable:true`, confidence 45→50 |

Notable insight from real output: rainfall −20% *raised* rabi-onion's climate-fit
score (+6) because the scaled zone band aligns better with the crop window — an
artifact of coverage math on irrigated crops, visible and explainable thanks to
factor-level transparency.

## Key design decisions

1. **Transforms over forks**: scenarios project inputs rather than branch engine
   logic — no risk of divergence between base and stressed computations.
2. **Profit deltas compare top-vs-base-top**, matching how a farmer reads the
   table ("what would I earn under this scenario's best choice?").
3. **Confidence reacts to reality**: the metric now distinguishes "no weather
   service" from "weather service healthy" instead of hardcoding pessimism.
4. **Simulator runs client-side against the API only** — all math stays server-side
   and deterministic.

## Known gaps / deferred

- Advanced farmer inputs (area, budget, expected yield/price) not yet in UI;
  economics already accept them via API.
- Sensitivity explores single-dimension perturbations; combinatorial sweeps come
  with Phase 6 evaluation.
- Recharts chart is descriptive, not interactive beyond tooltips.

## Phase 4 entry criteria — met

Structured, deterministic outputs with rich explainability now exist in final API
shape — exactly the payload Gemini will be allowed to narrate (never recalculate)
in the next phase.
