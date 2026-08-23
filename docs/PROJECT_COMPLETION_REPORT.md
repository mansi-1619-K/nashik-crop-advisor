# PROJECT COMPLETION REPORT

**Date:** 2026-08-23 · **Status:** ✅ Project complete · Phases 0–7 delivered

## What was built

Nashik Crop Advisor is a hyperlocal crop decision-support prototype for Nashik
district, Maharashtra, engineered around one principle: **deterministic engines
compute, AI narrates, everything carries an honest source label, and every
feature works with zero API keys.**

| Phase | Delivered | Report |
| --- | --- | --- |
| 0 | Foundation: Next.js 16 scaffold, Zod dataset contracts, 6 provenance-tagged datasets | [PHASE_0](PHASE_0_REPORT.md) |
| 1 | Deterministic engine: hard constraints → 7-factor suitability → ranking roles → confidence | [PHASE_1](PHASE_1_REPORT.md) |
| 2 | Weather intelligence (Open-Meteo, fallback-only cache) + economics engine | [PHASE_2](PHASE_2_REPORT.md) |
| 3 | Explainability, sensitivity analysis, What-If simulator, live dashboard | [PHASE_3](PHASE_3_REPORT.md) |
| 4 | Gemini narration layer: JSON mode, Zod validation, retry ladder, deterministic fallbacks, farm chat | [PHASE_4](PHASE_4_REPORT.md) |
| 5 | RAG grounding: local corpus, lexical retrieval, hallucination-proof citation contract | [PHASE_5](PHASE_5_REPORT.md) |
| 6 | Evaluation harness: scenario benchmarks, stability, retrieval metrics, live-AI measurement | [PHASE_6](PHASE_6_REPORT.md) |
| 7 | Close-out: architecture finalized, limitations consolidated, this report | this file |

## Final measured state (2026-08-23)

All numbers below come from recorded runs (`evaluation/reports/`) and the
verification gate at close-out — none are transcribed estimates.

| Gate | Result |
| --- | --- |
| Test suite | **162/162 passing** (23 files) |
| typecheck / lint / build | clean |
| Scenario expectations | **0/49 failures**, primary accuracy **5/5** |
| Constraint-violation rate | **1.0** |
| Engine latency (in-process) | p50 0.63 ms · p95 23.7 ms |
| Ranking stability (14 perturbations) | primary persisted 12/14; flips only across documented hard thresholds |
| Retrieval (lexical RAG, 14 labels) | P@3 0.929 · R@3 **1.0** · MRR **1.0** |
| Live Gemini (`gemini-3.6-flash`, 5 calls) | fallback rate **0** · first-attempt schema validity **1.0** · hallucinated citations **0** |
| Narration latency (live) | p50 ≈ 19.9 s · p95 ≈ 33.5 s (recorded limitation) |

## Keyless guarantee

Without any API key: constraints, scoring, ranking, economics, what-if,
explainability, weather signals (when Open-Meteo is reachable), advisory
narratives (template-built from engine output) and chat (intent-routed over
engine data) all function — labelled STATIC FALLBACK / HEURISTIC rather than
pretending to be live or AI-generated.

## Where the honest edges are

Consolidated in [LIMITATIONS.md](LIMITATIONS.md): assumed agronomy throughout
(`quality: assumed`), sample market data, lexical-not-semantic retrieval over a
small English corpus, high thinking-model narration latency, desk-judgement
evaluation fixtures, and a 5-call live-AI sample size. The reporting rule stands:
metrics not produced by a recorded run appear as NOT MEASURED, never estimated.

## Running it

```bash
npm install
npm run dev          # full experience keyless
npm test             # 162 tests
npm run evaluate     # deterministic evaluation → evaluation/reports/
npm run evaluate:ai  # live-AI metrics (GEMINI_API_KEY in .env.local)
```

Full documentation index: [README.md](../README.md) · architecture:
[ARCHITECTURE.md](ARCHITECTURE.md) · development history:
[DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md).
