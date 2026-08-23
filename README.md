# Nashik Crop Advisor

**Hyperlocal AI Decision Support for Climate-Aware Crop Planning** — Nashik District, Maharashtra.

A portfolio-grade AI/ML engineering prototype combining:

- A **deterministic agricultural engine** (hard constraints + transparent suitability scoring) that works with zero API keys
- **Weather intelligence** from Open-Meteo translated into heuristic advisory signals
- A transparent **economic model** with honest source labelling
- **Gemini-powered explanations and Q&A** grounded in engine output and RAG evidence — never overriding deterministic results
- **What-if simulation**, explainability, confidence metrics and an evaluation harness

> ✅ **Status: complete (Phases 0–6).** Deterministic engine, weather intelligence,
> economics, Gemini narration, RAG grounding and a measured evaluation harness are
> all implemented. Latest run: 162/162 tests · 0/49 scenario expectation failures ·
> live AI fallback rate 0 with 0 hallucinated citations. See
> [docs/EVALUATION.md](docs/EVALUATION.md) and
> [evaluation/reports/EVALUATION_REPORT.md](evaluation/reports/EVALUATION_REPORT.md).

## Quick start

```bash
npm install
npm run dev                    # keyless: full deterministic experience + honest static fallbacks
cp .env.example .env.local     # optional: add GEMINI_API_KEY for AI narration
```

| Command               | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | Start the dev server                           |
| `npm run build`       | Production build                               |
| `npm test`            | Vitest suite (162 tests)                       |
| `npm run lint`        | ESLint                                         |
| `npm run typecheck`   | TypeScript strict check                        |
| `npm run evaluate`    | Deterministic evaluation suite → report        |
| `npm run evaluate:ai` | Live-AI metrics (requires `GEMINI_API_KEY`)    |

## Documentation

- [Project Completion Report](docs/PROJECT_COMPLETION_REPORT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Agricultural Model](docs/AGRICULTURAL_MODEL.md)
- [Decision Engine](docs/DECISION_ENGINE.md)
- [Weather Engine](docs/WEATHER_ENGINE.md)
- [Economic Model](docs/ECONOMIC_MODEL.md)
- [RAG Architecture](docs/RAG_ARCHITECTURE.md)
- [AI Design](docs/AI_DESIGN.md)
- [Evaluation](docs/EVALUATION.md)
- [Limitations](docs/LIMITATIONS.md)
- [Development Log](docs/DEVELOPMENT_LOG.md)

## Data honesty

Every important value carries exactly one source label:
`LIVE` · `STATIC` · `ESTIMATED` · `HEURISTIC` · `AI-GENERATED` · `USER-PROVIDED`.

This is a decision-support tool, not an oracle. It will never claim guaranteed
yields, profits or disease detection.
