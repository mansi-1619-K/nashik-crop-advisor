# Nashik Crop Advisor

**Hyperlocal AI Decision Support for Climate-Aware Crop Planning** — Nashik District, Maharashtra.

A portfolio-grade AI/ML engineering prototype combining:

- A **deterministic agricultural engine** (hard constraints + transparent suitability scoring) that works with zero API keys
- **Weather intelligence** from Open-Meteo translated into heuristic advisory signals
- A transparent **economic model** with honest source labelling
- **Gemini-powered explanations and Q&A** grounded in engine output and RAG evidence — never overriding deterministic results
- **What-if simulation**, explainability, confidence metrics and an evaluation harness

> ⚠️ **Status: Phase 0 — Foundation.** The domain models, datasets and UI shell exist;
> engines arrive in Phase 1+. Nothing on screen computes recommendations yet.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional until Phase 4
npm run dev
```

| Command         | Purpose                  |
| --------------- | ------------------------ |
| `npm run dev`   | Start the dev server     |
| `npm run build` | Production build         |
| `npm test`      | Vitest suite             |
| `npm run lint`  | ESLint                   |
| `npm run typecheck` | TypeScript strict check |

## Documentation

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
