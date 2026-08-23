import { loadDataset } from "@/lib/utils/datasetLoader";
import {
  knowledgeBaseDatasetSchema,
  type KnowledgeBaseDataset,
  type KnowledgeChunk,
  type KnowledgeDocument,
} from "./types";

const MAX_CHUNK_CHARS = 700;

export class KnowledgeBaseLoadError extends Error {
  constructor(cause: string) {
    super(`Knowledge base could not be loaded: ${cause}`);
    this.name = "KnowledgeBaseLoadError";
  }
}

function splitLongParagraph(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*/g) ?? [text];
  const parts: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current.length > 0 && current.length + sentence.length > MAX_CHUNK_CHARS) {
      parts.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim().length > 0) parts.push(current.trim());
  return parts;
}

/**
 * Chunk a document into retrievable passages: one chunk per paragraph, each
 * prefixed with document title + section heading so the passage stays
 * self-describing outside its original context. Chunk ids are stable
 * (`<docId>#<ordinal>`) which makes citation ids reproducible across runs.
 */
export function buildChunks(doc: KnowledgeDocument): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  for (const section of doc.content) {
    for (const paragraph of section.paragraphs) {
      for (const part of splitLongParagraph(paragraph)) {
        chunks.push({
          id: `${doc.id}#${chunks.length}`,
          documentId: doc.id,
          title: doc.title,
          organization: doc.organization,
          credibility: doc.credibility,
          sourceUrl: doc.sourceUrl,
          sectionHeading: section.heading,
          updated: doc.updated,
          crops: doc.crops,
          topics: doc.topics,
          text: `${doc.title} — ${section.heading}: ${part}`,
        });
      }
    }
  }
  return chunks;
}

function loadCorpus(): KnowledgeChunk[] {
  let dataset: KnowledgeBaseDataset;
  try {
    dataset = loadDataset(knowledgeBaseDatasetSchema, "knowledge", "nashik-agri-handbook.json");
  } catch (error) {
    throw new KnowledgeBaseLoadError(error instanceof Error ? error.message : String(error));
  }
  const seen = new Set<string>();
  const chunks = dataset.documents.flatMap((doc) => buildChunks(doc));
  for (const chunk of chunks) {
    if (seen.has(chunk.id)) {
      throw new KnowledgeBaseLoadError(`duplicate chunk id ${chunk.id}`);
    }
    seen.add(chunk.id);
  }
  return chunks;
}

let cachedChunks: KnowledgeChunk[] | undefined;

export function getKnowledgeChunks(): KnowledgeChunk[] {
  cachedChunks ??= loadCorpus();
  return cachedChunks;
}

/** Test seam: drop the module cache (and optionally force a loader failure). */
export function resetKnowledgeChunksForTests(): void {
  cachedChunks = undefined;
}
