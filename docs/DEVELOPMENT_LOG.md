# Development Log

## Phase 4 — Gemini Reasoning Layer (2026-08-22)

- `@google/genai` 2.18 behind a DI `JsonGenerator` seam: JSON mode, Zod-validated
  structured output, transient/permanent error classification, retry ladder
- Grounding-rule prompt builders; privacy assertions on payloads
- Deterministic fallback narrative + intent-routed keyless chat responder
- `POST /api/advisory` + `POST /api/chat` with sanitised history
- UI: AI advisory card with source badges, follow-up chips, threaded chat
- 25 new tests → **127 total**; keyless live smoke shows honest static fallback

## Phase 3 — Explainability + Sensitivity (2026-08-22)

- `lib/agriculture/sensitivity.ts`: input-projection scenarios (rainfall/water/
  price/cost/yield), default stress set + custom lists, ranking-stability metric
- `POST /api/simulate`; `/api/recommend` now feeds live-weather availability into
  confidence (verified live: 45→50 for Niphad)
- Dashboard alive: workspace drives recommendations; weather strip with provenance
  badges + advisory signals; factor contribution bars; why/why-not sections;
  What-If Farm Simulator (sliders, BASE vs SCENARIO, Recharts stress chart)
- 19 new tests → **102 total**; live smokes: simulate table, weather-confidence

## Phase 2 — Weather + Economics (2026-08-22)

- Open-Meteo client (Zod validation, typed errors), WMO parser, fallback-only
  cache with live/cached/stale labelling, `GET /api/weather` with honest 503s
- Seven heuristic advisory signals with horizon-based confidence and enforced
  non-diagnostic language
- `computeEconomics` point engine with per-input source classes; MarketProvider
  abstraction (static sample default)
- 38 new tests → 83 total; live smoke vs real Open-Meteo (fungal window flagged
  correctly at 100% RH)

## Phase 1 — Deterministic Agricultural Engine (2026-08-22)

- Constraint engine (zone/season/water/soil/climate + monsoon substitution)
- Suitability scoring: 7 weighted factors − risk penalty, generated reasons
- Ranking roles (primary/secondary/resilient-alternative) + why-ranked-lower
- Deduction-based confidence; range-based economics seed; `POST /api/recommend`
- Millet rainfall-band contradictions caught by the engine's own tests
- 30 new tests → 45 total

## Phase 0 — Project Foundation (2026-08-22)

- Next.js 16.3.2 scaffold; domain models + Zod dataset contracts; six provenance-
  tagged datasets; Vitest harness (15 data-contract tests); dashboard shell with
  honest empty states; docs skeleton

See [PHASE_0_REPORT.md](PHASE_0_REPORT.md), [PHASE_1_REPORT.md](PHASE_1_REPORT.md),
[PHASE_2_REPORT.md](PHASE_2_REPORT.md), [PHASE_3_REPORT.md](PHASE_3_REPORT.md).

