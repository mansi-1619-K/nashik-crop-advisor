import { getKnowledgeChunks } from "./corpus";
import {
  citationFromChunk,
  type Citation,
  type EvidenceBundle,
  type KnowledgeChunk,
} from "./types";

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "does",
  "for", "from", "has", "have", "how", "i", "if", "in", "is", "it", "its", "my",
  "of", "on", "or", "should", "so", "than", "that", "the", "their", "them",
  "then", "there", "these", "this", "to", "was", "we", "were", "what", "when",
  "which", "who", "why", "will", "with", "would", "you", "your",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9\u0900-\u097F]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

const CREDIBILITY_WEIGHT: Record<string, number> = {
  icar: 0.6,
  university: 0.5,
  government: 0.4,
  industry: 0.2,
  internal: 0,
};

export interface EvidenceRetriever {
  retrieve(query: string, opts?: { topK?: number; minScore?: number }): EvidenceBundle;
}

interface IndexedChunk {
  chunk: KnowledgeChunk;
  tokens: Map<string, number>;
  length: number;
}

/**
 * Deterministic lexical retriever (TF-IDF with crop/topic tag boosts and a
 * small credibility tie-breaker). No network calls, no embedding API —
 * retrieval works identically keyless, which keeps the RAG layer honest
 * about being a local reference index.
 */
export function createEvidenceRetriever(loadChunks: () => KnowledgeChunk[]): EvidenceRetriever {
  function retrieve(query: string, opts?: { topK?: number; minScore?: number }): EvidenceBundle {
    const topK = Math.max(1, opts?.topK ?? 3);
    const minScore = opts?.minScore ?? 0.5;
    let chunks: KnowledgeChunk[];
    try {
      chunks = loadChunks();
    } catch {
      return { chunks: [], citations: [], unavailable: true };
    }

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0 || chunks.length === 0) {
      return { chunks: [], citations: [], unavailable: false };
    }

    const indexed: IndexedChunk[] = chunks.map((chunk) => {
      const tokens = new Map<string, number>();
      for (const token of [
        ...tokenize(chunk.text),
        ...chunk.topics.flatMap((t) => t.split("-")),
        ...chunk.crops.flatMap((c) => c.split("-")),
      ]) {
        tokens.set(token, (tokens.get(token) ?? 0) + 1);
      }
      // Topic/crop tags count double — they are the strongest intent signals.
      for (const tag of [...chunk.topics.flatMap((t) => tokenize(t)), ...chunk.crops]) {
        tokens.set(tag, (tokens.get(tag) ?? 0) + 1);
      }
      return { chunk, tokens, length: Math.max(8, [...tokenize(chunk.text)].length) };
    });

    const docFreq = new Map<string, number>();
    for (const token of queryTokens) {
      if (docFreq.has(token)) continue;
      let df = 0;
      for (const entry of indexed) if (entry.tokens.has(token)) df++;
      docFreq.set(token, df);
    }

    const scored = indexed.map(({ chunk, tokens, length }) => {
      let score = 0;
      for (const token of queryTokens) {
        const tf = tokens.get(token);
        if (!tf) continue;
        const idf = Math.log(1 + indexed.length / (1 + (docFreq.get(token) ?? 0)));
        score += (tf / length) * idf * 6;
      }
      score += CREDIBILITY_WEIGHT[chunk.credibility] ?? 0;
      return { chunk, score };
    });

    const hits = scored
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
      .slice(0, topK);

    const dedupedCitations = new Map<string, Citation>();
    for (const hit of hits) {
      if (!dedupedCitations.has(hit.chunk.documentId)) {
        dedupedCitations.set(hit.chunk.documentId, citationFromChunk(hit.chunk));
      }
    }

    return {
      chunks: hits.map((h) => ({ ...h.chunk, score: Number(h.score.toFixed(4)) })),
      citations: [...dedupedCitations.values()],
      unavailable: false,
    };
  }

  return { retrieve };
}

let defaultRetriever: EvidenceRetriever | undefined;

export function getEvidenceRetriever(): EvidenceRetriever {
  defaultRetriever ??= createEvidenceRetriever(getKnowledgeChunks);
  return defaultRetriever;
}

/** Test seam. */
export function setEvidenceRetriever(retriever: EvidenceRetriever | undefined): void {
  defaultRetriever = retriever;
}
