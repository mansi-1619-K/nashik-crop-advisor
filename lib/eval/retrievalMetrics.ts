import { getEvidenceRetriever } from "@/lib/rag/retrieve";
import type { RetrievalEvalSummary, RetrievalLabelsFile } from "./types";

/**
 * Precision@3 / Recall@3 / MRR of the lexical retriever over desk-labelled
 * queries. Relevance is defined at document level: a retrieved chunk counts
 * as a hit when its documentId is in the label's relevant set.
 */
export function evaluateRetrieval(file: RetrievalLabelsFile): RetrievalEvalSummary {
  const retriever = getEvidenceRetriever();
  let precisionSum = 0;
  let recallSum = 0;
  let reciprocalRankSum = 0;
  const misses: RetrievalEvalSummary["misses"] = [];

  for (const label of file.labels) {
    const bundle = retriever.retrieve(label.query, { topK: 3 });
    const relevant = new Set(label.relevant);
    const hits = bundle.chunks.filter((c) => relevant.has(c.documentId));

    precisionSum += bundle.chunks.length === 0 ? 0 : hits.length / bundle.chunks.length;
    recallSum += label.relevant.length === 0 ? 1 : new Set(hits.map((h) => h.documentId)).size / relevant.size;

    const firstHitRank = bundle.chunks.findIndex((c) => relevant.has(c.documentId));
    reciprocalRankSum += firstHitRank === -1 ? 0 : 1 / (firstHitRank + 1);

    if (hits.length === 0) {
      misses.push({
        query: label.query,
        retrieved: bundle.chunks.map((c) => c.documentId),
        relevant: label.relevant,
      });
    }
  }

  const n = file.labels.length;
  return {
    queryCount: n,
    precisionAt3: n === 0 ? 0 : Number((precisionSum / n).toFixed(4)),
    recallAt3: n === 0 ? 0 : Number((recallSum / n).toFixed(4)),
    mrr: n === 0 ? 0 : Number((reciprocalRankSum / n).toFixed(4)),
    misses,
  };
}
