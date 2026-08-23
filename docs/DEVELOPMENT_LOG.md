# Development Log

## Post-completion hardening round 1 (2026-08-23)

- CI: GitHub Actions workflow (lint → typecheck → tests → build → deterministic
  evaluation) with report artifact + README badge
- Latency: `GEMINI_THINKING` control (default LOW ≈ 1.5–1.8s p50 measured vs
  ≈ 19.9s at HIGH); thinkingBudget:0 is rejected by Gemini 3 — thinkingLevel is
  the working lever; eval harness gained EVAL_AI_REPEATS/EVAL_AI_PACE_MS and
  records per-call fallback reasons (caught our own burst-429s masquerading as
  model failures)
- Retrieval: TF-IDF heuristic → Okapi BM25 (k1=1.4, b=0.75) + IDF-weighted
  phrase-adjacency bonus; corpus expanded 14→25 documents; MRR restored to 1.0
  after the phrase bonus fixed a downy-vs-powdery mildew rank inversion
- Chat transcript persistence now opt-in on-device (localStorage, clear button,
  honest ephemeral/saved status line)
- Taluka centroids refined to 3-decimal values (zones dataset v0.2.0)

## Phase 7 — Project Close-Out (2026-08-23)

- Architecture finalized (layer diagram, failure-resilience chain, module map)
- Agricultural model documentation completed; limitations consolidated to 11 items
- README updated from Phase 0 skeleton to completion status with measured numbers
- Default Gemini model switched to `gemini-3.6-flash` after `gemini-2.5-flash`
  retirement for new keys (caught by the live evaluation run)
- Final gate: 162/162 tests · typecheck/lint/build clean · see
  [PROJECT_COMPLETION_REPORT.md](PROJECT_COMPLETION_REPORT.md)

## Phase 6 — Evaluation Harness (2026-08-23)

- `lib/eval/`: scenario runner with expectation diffing, perturbation stability,
  retrieval P/R/MRR, live-AI metrics through a recording generator seam, and a
  report renderer that renders unmeasured sections as NOT MEASURED
- Fixtures: 10 scenario benchmarks + 14 retrieval labels (quality: assumed)
- `npm run evaluate` / `npm run evaluate:ai`; engine gained additive
  `RecommendationOutput.ranked` field for true top-K measurement
- First run failed 2/48 desk expectations; both traced to fixture calibration
  (drought weighting under rainfed; soil excellence vs drought tolerance) and
  were recalibrated openly — engine behaviour matched its documented rules
- Live measurements: deterministic gates all clean; retrieval R@3 = 1.0;
  5 real Gemini calls → 0 fallbacks, first-attempt validity 1.0, 0 hallucinated
  citations; narration latency ~20 s median recorded as a limitation
- 13 new tests → **162 total**

## Phase 5 — RAG Grounded-Knowledge Layer (2026-08-23)

- `lib/rag/`: 14-document reference corpus (`data/knowledge/`), paragraph chunker
  with stable ids, local lexical TF-IDF retriever with crop/topic tag boosts and
  credibility tie-breaker — deterministic and keyless
- Citation contract: prompts embed tier-labelled passages; models emit optional
  `citationIds` which orchestrators resolve against the exact bundle, dropping
  invented ids; raw ids never reach the client
- UI citation chips with organization + credibility tier; "Grounded reading"
  under the advisory card
- Corpus failure degrades to no evidence, never a failed request; static
  fallbacks carry no citations by design
- 22 new tests → **149 total**; keyless live smoke shows honest static answers

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
[PHASE_2_REPORT.md](PHASE_2_REPORT.md), [PHASE_3_REPORT.md](PHASE_3_REPORT.md),
[PHASE_4_REPORT.md](PHASE_4_REPORT.md), [PHASE_5_REPORT.md](PHASE_5_REPORT.md),
[PHASE_6_REPORT.md](PHASE_6_REPORT.md), [PROJECT_COMPLETION_REPORT.md](PROJECT_COMPLETION_REPORT.md).

