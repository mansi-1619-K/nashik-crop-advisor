# PHASE 4 REPORT — Gemini Reasoning Layer

**Date:** 2026-08-22 · **Status:** ✅ Complete · **All gates passed**

## Objective

Add Gemini as a *narration layer* over the deterministic engine: structured output,
strict validation, retries, graceful fallback, and a contextual farm assistant —
while guaranteeing the system works identically (minus phrasing quality) with no
API key at all.

## Delivered

| Piece | File(s) | Detail |
| --- | --- | --- |
| Official SDK integration | `lib/ai/gemini.ts` | `@google/genai` 2.18; JSON response mode; DI-friendly `JsonGenerator` seam; transient/permanent error classification; retry ladder (3 attempts advisory / 2 chat) with backoff |
| Output contracts | `lib/ai/schemas.ts` | `advisoryNarrativeSchema` + `chatAnswerSchema` with Zod; markdown-fence-tolerant JSON extraction (`extractJson`) |
| Grounding prompts | `lib/ai/prompts.ts` | 7 absolute rules (never calculate/invent/override; respect source labels; advisory-not-diagnosis; farmer tone; JSON-only); compact engine snapshots |
| Deterministic fallbacks | `lib/ai/fallback.ts` | narrative builder + intent-routed chat responder (why/water/risk/economics + honest refusal for out-of-scope), all from engine data |
| Orchestrators | `lib/ai/advisory.ts`, `lib/ai/chat.ts` | validated generation → labelled `ai_generated` or `static` result with reason/model/attempts |
| API routes | `POST /api/advisory`, `POST /api/chat` | shared `runEngineForRequest` (context validation + best-effort weather signals); history sanitised to last 6 turns / 1000 chars |
| UI | `components/dashboard/ai-advisor.tsx` | advisory card with AI-GENERATED vs STATIC FALLBACK badges, model label, actions list, warnings, clickable follow-ups; threaded chat with per-answer source badges and caveats |

## Verification gate

| Check | Result |
| --- | --- |
| `npm test` | ✅ **127/127** (25 new: generator matrix 7, prompts+fallbacks 10, orchestrators 5, routes 5 — incl. schema-retry, fail-fast auth errors, unconfigured path, privacy assertion on prompts) |
| typecheck / lint / build | ✅ clean — `/api/advisory` + `/api/chat` dynamic routes present |
| Keyless live smoke | ✅ `/api/advisory` → `source:"static"`, `attempts:0` (SDK never called), narrative grounded in engine output; `/api/chat` risk question answered from engine warnings with heuristic caveat |

## Design decisions

1. **DI generator seam instead of SDK mocking everywhere** — tests inject
   scripted generators; the SDK is only constructed when a key exists.
2. **Fallbacks are first-class products**, not error strings: the same narrative
   shape renders whether it came from Gemini or templates, with honest labelling.
3. **Chat regenerates the engine snapshot server-side per message** — deterministic,
   cheap (cached datasets), immune to client tampering with context.
4. **Privacy by construction**: payload builder has access only to non-identifying
   domain fields; a test asserts prompts never contain credential patterns.
5. Model configurable via `GEMINI_MODEL`; default `gemini-2.5-flash`.

## Known gaps / deferred

- **Live Gemini call not exercised**: this environment has no `GEMINI_API_KEY`;
  every AI-path test uses scripted generators. With a key set, behaviour is
  expected to match the contract but is not yet *measured* — the evaluation
  phase (Phase 6) will measure structured-output validity against real calls.
- Chat history capped at 6 turns; no persistence (privacy-first choice).
- No token accounting yet.

## Phase 5 entry criteria — met

The narration pipeline already accepts an "evidence" field slot in its payload
architecture; RAG retrieval can now feed citations into prompts and UI without
touching the deterministic core.
