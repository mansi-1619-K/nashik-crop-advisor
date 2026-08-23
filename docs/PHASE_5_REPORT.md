# PHASE 5 REPORT — RAG Grounded-Knowledge Layer

**Date:** 2026-08-23 · **Status:** ✅ Complete · **All gates passed**

## Objective

Give the narration layer retrievable evidence: a local reference corpus with
honest provenance, deterministic retrieval that works identically keyless, a
citation contract that survives model hallucination, and UI that always shows
the credibility tier behind every grounded statement.

## Delivered

| Piece | File(s) | Detail |
| --- | --- | --- |
| Reference corpus | `data/knowledge/nashik-agri-handbook.json` | 14 documents (grape mildews, onion thrips/blotch/curing/storage, paddy blast, drip scheduling, mulching, soil testing, seed treatment, IPM, monsoon contingency, pomegranate blight, tomato post-harvest); standard `meta` envelope, `quality: assumed` |
| Ingestion contracts | `lib/rag/types.ts` | document/section Zod schemas; 5 credibility tiers (`icar > university > government > industry > internal`); `KnowledgeChunk`, `Citation`, `EvidenceBundle` |
| Chunker + loader | `lib/rag/corpus.ts` | paragraph chunks prefixed `"<title> — <section>:"`, sentence-boundary splits (~700 chars), stable `<docId>#<n>` ids, duplicate-id guard, module cache |
| Retriever | `lib/rag/retrieve.ts` | local lexical TF-IDF, stopword removal, double-weighted crop/topic tags, credibility tie-breaker, stable ordering, DI factory + test seam |
| Citation resolution | `lib/rag/evidence.ts` | id→Citation resolution that drops invented ids; engine-derived advisory query builder |
| Prompt wiring | `lib/ai/prompts.ts` | `REFERENCE KNOWLEDGE` block with per-passage tier labels; cite-only-listed-ids rule; explicit `"citationIds": []` instruction when no evidence |
| Schemas | `lib/ai/schemas.ts` | optional `citationIds` on both narrative and chat schemas |
| Orchestrators | `lib/ai/advisory.ts`, `lib/ai/chat.ts` | resolve citations against the exact provided bundle; strip raw ids before returning |
| Routes | `app/api/chat`, `app/api/advisory` | server-side retrieval per request; corpus failure degrades to no evidence, never a 5xx |
| UI | `components/dashboard/ai-advisor.tsx` | citation chips (title · organization · tier), outbound links only when `sourceUrl` exists, "Grounded reading" section under the advisory |

## Verification gate

| Check | Result |
| --- | --- |
| `npm test` | ✅ **149/149** (22 new: chunking/stability 4, retrieval matrix 7, prompt+citation orchestration 7, keyless API flow 3 — incl. invented-id dropping, stopword-only queries, corpus-failure → `unavailable`) |
| typecheck / lint / build | ✅ clean |
| Keyless live smoke | ✅ `/api/chat` storage question → honest static fallback, no fabricated citations; `/api/advisory` → static narrative unchanged by retrieval path |

## Design decisions

1. **Local lexical retrieval, not embeddings** — zero network, zero API cost,
   fully deterministic and reproducible; consistent with the keyless-first
   guarantee every other layer upholds.
2. **Seed corpus is honestly `internal`** — editorial syntheses labelled as
   pending ICAR/university validation. No institutional attribution or URL is
   fabricated to look credible; the tier system exists so real sources slot in
   later without code changes.
3. **Hallucinated citations are dropped, not retried** — citations are additive
   grounding, so silently filtering unknown ids keeps answers intact while
   never surfacing an unverifiable reference.
4. **Static fallbacks carry no citations** — their text comes from the engine,
   not from corpus passages; attaching references would imply grounding that
   does not exist.
5. Chunk ids are position-stable (`docId#ordinal`), making citation ids
   reproducible across runs and safe to log.

## Known gaps / deferred

- Retrieval quality is unmeasured beyond unit tests — relevance metrics
  (top-K agreement vs expert expectation) belong to the Phase 6 evaluation harness.
- Corpus is small (14 docs) and English-only; Marathi passages will need script-aware tokenisation.
- No embedding-based semantic matching yet; paraphrase gaps are covered only by tag boosts.

## Phase 6 entry criteria — met

The evaluation phase can now measure: structured-output validity with real
Gemini calls, citation precision/recall of the retriever over labelled queries,
and fallback success rates — all through existing DI seams.
