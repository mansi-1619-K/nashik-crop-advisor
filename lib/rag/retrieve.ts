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

/** Okapi BM25 parameters — k1 controls tf saturation, b length normalisation. */
const BM25_K1 = 1.4;
const BM25_B = 0.75;

export interface EvidenceRetriever {
  retrieve(query: string, opts?: { topK?: number; minScore?: number }): EvidenceBundle;
}

interface IndexedChunk {
  chunk: KnowledgeChunk;
  tokens: Map<string, number>;
  /** Ordered token stream used for phrase-adjacency bonuses. */
  sequence: string[];
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
    // Epsilon floor: only queries whose tokens match NOTHING come back empty.
    // BM25 magnitudes vary with corpus composition, so no absolute cutoff.
    const minScore = opts?.minScore ?? Number.EPSILON;
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

    // Index: term frequencies (tags count double — strongest intent signals)
    // plus true document lengths for BM25 length normalisation.
    const indexed: IndexedChunk[] = chunks.map((chunk) => {
      const tokens = new Map<string, number>();
      const bodyTokens = tokenize(chunk.text);
      for (const token of bodyTokens) {
        tokens.set(token, (tokens.get(token) ?? 0) + 1);
      }
      for (const tag of [...chunk.topics.flatMap((t) => tokenize(t)), ...chunk.crops]) {
        for (const part of tokenize(tag).length > 0 ? tokenize(tag) : [tag]) {
          tokens.set(part, (tokens.get(part) ?? 0) + 2);
        }
      }
      return { chunk, tokens, sequence: bodyTokens, length: Math.max(8, bodyTokens.length) };
    });

    const N = indexed.length;
    const avgdl = indexed.reduce((sum, e) => sum + e.length, 0) / N;

    const docFreq = new Map<string, number>();
    for (const token of queryTokens) {
      if (docFreq.has(token)) continue;
      let df = 0;
      for (const entry of indexed) if (entry.tokens.has(token)) df++;
      docFreq.set(token, df);
    }

    const idf = (df: number) => Math.log((N - df + 0.5) / (df + 0.5) + 1);

    /** Count adjacent occurrences of a query bigram in the chunk token stream. */
    const phraseCount = (sequence: string[], a: string, b: string): number => {
      let count = 0;
      for (let i = 0; i < sequence.length - 1; i++) {
        if (sequence[i] === a && sequence[i + 1] === b) count++;
      }
      return count;
    };

    const scored = indexed.map(({ chunk, tokens, sequence, length }) => {
      let score = 0;
      for (const token of queryTokens) {
        const tf = tokens.get(token);
        if (!tf) continue;
        const df = docFreq.get(token) ?? 0;
        const norm = tf * (BM25_K1 + 1) / (tf + BM25_K1 * (1 - BM25_B + BM25_B * (length / avgdl)));
        score += idf(df) * norm;
      }
      // Phrase-adjacency bonus: multi-word concepts ("powdery mildew") that
      // appear verbatim outrank incidental single-word mentions.
      let bonus = 0;
      for (let i = 0; i < queryTokens.length - 1; i++) {
        const [a, b] = [queryTokens[i], queryTokens[i + 1]];
        const df = docFreq.get(a) ?? 0;
        bonus += 0.6 * Math.min(phraseCount(sequence, a, b), 3) * idf(df);
      }
      score += Math.min(bonus, 2.5);
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
