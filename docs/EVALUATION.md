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
| Precision@3 / Recall@3 / MRR | lexical retriever vs desk-labelled relevant documents | `lib/eval/retrievalMetrics.ts` |
| AI fallback rate, first-attempt schema validity, attempts, latency, citation emission/hallucination rate | real Gemini calls through production orchestrators; raw model output audited via a recording generator seam | `lib/eval/aiMetrics.ts` (`npm run evaluate:ai`) |

## Reproducibility

```bash
npm run evaluate        # deterministic suite → evaluation/reports/{EVALUATION_REPORT.md,engine-eval.json}
npm run evaluate:ai     # live AI calls → evaluation/reports/ai-eval.json (needs GEMINI_API_KEY)
```

`npm run evaluate` merges a previously recorded `ai-eval.json` if present;
without it the AI section renders as NOT MEASURED rather than stale numbers.
Exit code is non-zero when any scenario expectation fails.

## Latest measured results (2026-08-23)

Deterministic suite: constraint-violation rate **1.0** (0 failures), primary
accuracy **5/5**, 0/49 total expectation failures, latency p50 **0.63 ms** /
p95 **23.7 ms**. Stability over 14 perturbations: primary persisted **12/14
(0.857)**, mean top-3 overlap **0.869** — both flips occur when a perturbation
crosses a documented hard-requirement threshold (water demand tier, soil
compatibility class), i.e. explainable regime changes, not noise.

Retrieval (lexical RAG): P@3 **0.929**, R@3 **1.0**, MRR **1.0** — every labelled
query retrieved its target document inside the top chunk.

Live AI layer (5 calls, `gemini-3.6-flash`): fallback rate **0**, first-attempt
schema validity **1.0**, mean attempts **1.0**, citation emission rate **0.6**,
hallucinated-citation calls **0**, latency p50 **19.9 s** / p95 **33.5 s**.
The high narration latency is a real measured property of the current model
choice and is tracked in [LIMITATIONS.md](LIMITATIONS.md).

## Reporting rules

1. Numbers describe this commit's code against these fixtures only.
2. Fixture quality is `assumed`; metrics validate engineering consistency.
3. Unmeasured metrics must never be quoted as values.
