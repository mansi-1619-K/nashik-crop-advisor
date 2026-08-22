# Decision Engine

> Status: skeleton — implemented in Phase 1, sensitivity in Phase 3.

## Purpose

Specify the deterministic constraint + suitability + recommendation pipeline that
never depends on any LLM.

## Planned contents

- Hard agronomic constraints (season/water/soil/climate/zone) → eligible flag with
  structured violations & warnings
- Suitability scoring: factor weights (configurable), normalization to 0–100,
  documented formula and risk penalty
- Ranking roles: primary / secondary / climate-resilient alternative
- Confidence metric definition (data completeness, constraint agreement, score
  separation, weather/market availability, model availability)
- Why / why-not explainability contracts (`lib/agriculture/results.ts`)
- Invariant: Gemini may phrase results but never override constraints or scores;
  engine must run with `GEMINI_API_KEY` absent

## Current state (Phase 0)

Output contracts defined; no engine logic yet.
