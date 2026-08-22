# AI Design

> Status: skeleton — implemented in Phase 4.

## Purpose

Document how Gemini is used safely: as a language layer over deterministic output,
never as the source of truth.

## Planned contents

- Official Google GenAI SDK usage, server-side only key handling
- Structured input payload (context, weather, scores, constraints, evidence)
- Strict output schema (summary, explanation, actions, warnings, follow-ups)
  validated with Zod; retry/fallback policy on malformed output
- Contextual agricultural assistant design (farm context injection)
- Prohibited behaviours: inventing scores, overriding constraints, fabricating data
- Privacy: what farmer context is sent upstream, minimization rules

## Current state (Phase 0)

Not started.
