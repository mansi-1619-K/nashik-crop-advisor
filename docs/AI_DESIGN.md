# AI Design

> Status: **implemented (Phase 4)** · SDK: `@google/genai` 2.18 · Model: `GEMINI_MODEL` env or `gemini-3.6-flash` (default changed from `gemini-2.5-flash` in Phase 6 after Google retired it for new keys)

## Purpose

Document how Gemini is used **safely**: as a language layer over deterministic
output — never as the source of truth.

## Architecture: narration over computation

```
Deterministic engine (constraints → scores → ranking → economics)
        │ structured JSON snapshot
        ▼
Prompt builder (grounding rules + payload)   lib/ai/prompts.ts
        ▼
generateValidated()                          lib/ai/gemini.ts
   JSON mode → Zod validation → retry ladder
        ▼ ok?                      ▼ any failure?
AdvisoryResult{ai_generated}   AdvisoryResult{static = deterministic fallback}
```

The engine never calls the LLM; the LLM never feeds back into engine state. With
`GEMINI_API_KEY` absent every feature still works through deterministic fallbacks,
labelled `STATIC FALLBACK` in the UI.

## What is sent upstream (privacy contract)

Sent: zone / taluka / season / soil / water availability, engine scores, factor
reasons, estimated economics *ranges*, constraint violations, weather-signal
summaries, and (Phase 5) passages from the local reference handbook with their
credibility tiers. Retrieved passages originate from our own corpus file — no
farmer data enters retrieval.

Never sent: names, contacts, coordinates more precise than taluka centroids, chat
content beyond the current session's last 6 turns. No analytics on farmer input.
Tests assert prompts contain no credential material.

## Structured output & validation (`lib/ai/schemas.ts`)

| Schema | Shape |
| --- | --- |
| `advisoryNarrativeSchema` | summary, recommendationExplanation, actions[≤8], warnings[≤6], followUpQuestions[≤4] |
| `chatAnswerSchema` | answer, caveats[≤4], suggestedFollowUps[≤3] |

`extractJson()` tolerates markdown fences and stray prose around JSON objects.

## Retry & failure policy (`generateValidated`)

| Failure class | Behaviour |
| --- | --- |
| Not configured | immediate `not-configured`, zero network calls |
| Transient (429/5xx/timeouts/empty/non-JSON) | retry up to `maxAttempts` (3 advisory / 2 chat) with linear backoff |
| Permanent (400/401/403) | fail fast to fallback |
| Schema-invalid content | retried like transient; final failure reports which paths failed |

Every terminal failure returns a **deterministic fallback** built from the same
engine output (`lib/ai/fallback.ts`) — the app cannot crash from Gemini.

## Contextual assistant rules (`lib/ai/chat.ts`)

Answers must be derivable from the farm-context snapshot; out-of-scope questions
receive an explicit "cannot determine without guessing" response. The keyless
responder implements intent routing (why/water/risk/economics) directly over
engine data so behaviour is testable without a key.

## Prohibited behaviours (enforced by prompt contract + architecture)

- Inventing or altering scores, rankings, prices or constraints
- Presenting estimates/samples as measurements
- Diagnosing disease ("conditions favor pressure" language only)
- Suggesting a hard-constraint-excluded crop is actually fine
