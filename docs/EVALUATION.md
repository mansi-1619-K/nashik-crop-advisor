# Evaluation

> Status: **implemented (Phase 6)** · Run with `npm run evaluate` (+ `npm run evaluate:ai` for live-AI metrics) · Full report: [`../evaluation/reports/EVALUATION_REPORT.md`](../evaluation/reports/EVALUATION_REPORT.md)

## Purpose

Define what is measured, how, and enforce the rule that only measured numbers are
reported. Any metric not produced by a recorded run appears as **NOT MEASURED**.

## Fixture formats

| Fixture | Location | Schema | Quality |
| --- | --- | --- | --- |
| Scenario benchmarks (10 cases: expert / synthetic / edge-case) | `evaluation/scenarios/nashik-core-scenarios.json` | `lib/eval/types.ts → scenariosFileSchema` | assumed |
| Retrieval relevance labels (14 queries) | `evaluation/benchmarks/retrieval-labels.json` | `retrievalLabelsFileSchema` | assumed |

Expectations per scenario: `mustBeEligible`, `mustBeExcluded`, `expectedPrimary`,
`forbiddenPrimary`, `maxEligibleCount`. Fixtures are desk judgements validating
internal consistency and documented engine behaviour — not field-validated agronomy.

## Metrics & how they are computed

| Metric | Definition | Source |
| --- | --- | --- |
| Constraint-violation rate | share of `mustBeExcluded` expectations upheld across scenarios | `lib/eval/engineMetrics.ts` |
| Primary accuracy | scenarios where engine primary = declared expectation | same |
| Latency p50/p95 | in-process wall time of `generateRecommendations` per scenario | same |
| Primary persistence / top-3 overlap | before-vs-after water ±1 level and soil-neighbour perturbations | `lib/eval/stability.ts` |
| Precision@3 / Recall@3 / MRR | BM25 lexical retriever (with IDF-weighted phrase-adjacency bonus and crop/topic tag boosts) vs desk-labelled relevant documents | `lib/eval/retrievalMetrics.ts` |
| AI fallback rate, first-attempt schema validity, attempts, latency, citation emission/hallucination rate | real Gemini calls through production orchestrators; raw model output audited via a recording generator seam; fallback reasons recorded per call | `lib/eval/aiMetrics.ts` (`npm run evaluate:ai`) |

Run-count and pacing are configurable (`EVAL_AI_REPEATS`, `EVAL_AI_PACE_MS`) so
large samples do not trip provider rate limits — burst calling produces 429-driven
fallbacks that are measurement artefacts, not model behaviour, and each fallback's
reason is now recorded in the report.

## Reproducibility

```bash
npm run evaluate        # deterministic suite → evaluation/reports/{EVALUATION_REPORT.md,engine-eval.json}
npm run evaluate:ai     # live AI calls → evaluation/reports/ai-eval.json (needs GEMINI_API_KEY)
```

`npm run evaluate` merges a previously recorded `ai-eval.json` if present;
without it the AI section renders as NOT MEASURED rather than stale numbers.
Exit code is non-zero when any scenario expectation fails.

## Latest measured results (2026-08-23, post-hardening run)

Deterministic suite: constraint-violation rate **1.0** (0 failures), primary
accuracy **5/5**, 0/49 total expectation failures, latency p50 **0.63 ms** /
p95 **23.7 ms**. Stability over 14 perturbations: primary persisted **12/14
(0.857)**, mean top-3 overlap **0.869** — both flips occur when a perturbation
crosses a documented hard-requirement threshold (water demand tier, soil
compatibility class), i.e. explainable regime changes, not noise.

Retrieval (BM25 lexical over 25-document corpus): P@3 **0.929**, R@3 **1.0**,
MRR **1.0** — every labelled query retrieves its target document at rank 1.

Live AI layer (`gemini-3.6-flash`): narration latency is now thinking-mode
dependent by design. With `GEMINI_THINKING=low` (the default), successful calls
measured **p50 ≈ 1.5–1.8 s** with first-attempt schema validity intact on probe
runs; the earlier deep-reasoning mode measured p50 ≈ 19.9 s / p95 ≈ 33.5 s.
A full 15-call statistical re-run is pending free-tier quota reset; the harness
now records per-call fallback reasons so quota effects can never be mistaken
for model regressions.

## Reporting rules

1. Numbers describe this commit's code against these fixtures only.
2. Fixture quality is `assumed`; metrics validate engineering consistency.
3. Unmeasured metrics must never be quoted as values.
