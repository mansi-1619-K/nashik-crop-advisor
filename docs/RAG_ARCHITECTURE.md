# RAG Architecture

> Status: **implemented (Phase 5)** · Retrieval: local lexical TF-IDF · Corpus: `data/knowledge/nashik-agri-handbook.json`

## Purpose

Ground AI statements in retrievable reference passages with explicit citations —
so a claim in an answer can be traced to a specific document, section and
credibility tier, or marked as ungrounded.

## Document ingestion format

Every corpus document (`knowledgeDocumentSchema`, `lib/rag/types.ts`) carries:

| Field | Meaning |
| --- | --- |
| `id` / `title` / `organization` | identity + display provenance |
| `credibility` | tier from `icar > university > government > industry > internal` |
| `sourceUrl` *(optional)* | link shown in the UI when present |
| `updated` | ISO date, displayed on citation chips |
| `crops` / `topics` | retrieval tags (crop ids + hyphenated topic keys) |
| `content[]` | sections of paragraphs (the chunk source) |

The dataset envelope reuses the standard `meta` block (`quality: assumed`,
disclaimer, sources) like every other dataset.

## Credible-source policy

- Tiers exist so institutional documents outrank editorial summaries on score ties.
- **The seed corpus is entirely `internal`**: NCAdvisor editorial syntheses of widely
  documented practice, explicitly labelled "pending validation against ICAR / MPKV /
  department packages of practice". No fabricated institutional attribution.
- The UI always renders the tier next to every citation (`INTERNAL`, `ICAR`, …), so an
  internal summary can never masquerade as an institutional source.

## Chunking & retrieval

- **Chunking** (`lib/rag/corpus.ts`): one chunk per paragraph, prefixed with
  `"<title> — <section heading>:"` so passages stay self-describing; over-long
  paragraphs split on sentence boundaries (~700 chars). Chunk ids are stable
  `<docId>#<ordinal>` — citation ids reproduce across runs.
- **Retrieval** (`lib/rag/retrieve.ts`): deterministic local TF-IDF over
  tokenised text with stopword removal, double-weighted crop/topic tag matches,
  a small credibility tie-breaker, and stable score → id ordering. No network,
  no embedding API — retrieval behaves identically keyless.
- Queries come from the farmer's chat question (`topK: 3`) or from engine output
  for advisory narration (`buildAdvisoryQuery`: primary crop + weak factors +
  warnings + weather-signal types, `topK: 4`).

## Citation contract

```
EvidenceBundle { chunks[+score], citations[], unavailable }
KnowledgeChunk.id  ──►  Citation { chunkId, title, organization, credibility, sourceUrl?, sectionHeading, updated }
```

- Prompts render matched passages as `[<chunkId>] (<tier>) <text>` under a rule:
  *cite ONLY ids that appear above*.
- Models emit optional `citationIds`; orchestrators resolve them against the exact
  bundle provided — **invented ids are silently dropped**, never surfaced.
- Resolved `Citation[]` objects travel on `AdvisoryResult` / `ChatResult`; raw ids
  are stripped before anything reaches the client.
- Static fallbacks attach no citations: their text derives from engine output, not
  from corpus passages, so citing references would imply grounding that isn't there.

## Failure behaviour

| Condition | Behaviour |
| --- | --- |
| Corpus file missing/corrupt | retriever returns `unavailable: true`; prompts omit the evidence block; requests still succeed |
| Query has no strong match | empty bundle (`unavailable: false`); prompts instruct `"citationIds": []` |
| Model invents citation ids | dropped at resolution; answer keeps its other fields |

Retrieval failure never fails a request and never touches the deterministic core.

## Verification

22 tests cover chunking/stability, ranking, tag matching, credibility tie-breaks,
citation dedupe/resolution/dropping, prompt embedding, privacy patterns, and the
keyless API flow (`tests/rag/`, `tests/ai/citations.test.ts`, `tests/api/rag-flow.test.ts`).
