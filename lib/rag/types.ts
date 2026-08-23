import { z } from "zod";
import { datasetMetaSchema } from "@/lib/types/common";

/**
 * Credibility tiers for knowledge documents. The retrieval layer prefers
 * higher tiers when scores tie, and the UI always displays the tier so an
 * internal summary can never masquerade as an institutional source.
 *
 * The seed corpus ships as `internal` (editorial synthesis pending expert
 * validation). When real ICAR / university / department documents are added
 * they slot into the higher tiers without any code change.
 */
export const CREDIBILITY_TIERS = ["icar", "university", "government", "industry", "internal"] as const;

export type CredibilityTier = (typeof CREDIBILITY_TIERS)[number];

export const credibilityTierSchema = z.enum(CREDIBILITY_TIERS);

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected ISO date (YYYY-MM-DD)");

export const knowledgeSectionSchema = z.object({
  heading: z.string().min(1).max(160),
  paragraphs: z.array(z.string().min(1).max(2000)).min(1).max(6),
});

export interface KnowledgeSection {
  heading: string;
  paragraphs: string[];
}

export const knowledgeDocumentSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "document ids must be kebab-case"),
  title: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  credibility: credibilityTierSchema,
  sourceUrl: z.string().url().optional(),
  updated: isoDateSchema,
  crops: z.array(z.string().min(1)).max(12),
  topics: z.array(z.string().min(2).max(60)).min(1).max(10),
  content: z.array(knowledgeSectionSchema).min(1).max(8),
});

export interface KnowledgeDocument {
  id: string;
  title: string;
  organization: string;
  credibility: CredibilityTier;
  sourceUrl?: string;
  updated: string;
  crops: string[];
  topics: string[];
  content: KnowledgeSection[];
}

export const knowledgeBaseDatasetSchema = z.object({
  meta: datasetMetaSchema,
  documents: z.array(knowledgeDocumentSchema).min(1),
});

export interface KnowledgeBaseDataset {
  meta: import("@/lib/types/common").DatasetMeta;
  documents: KnowledgeDocument[];
}

/** A retrieved passage with full provenance attached. */
export interface KnowledgeChunk {
  id: string;
  documentId: string;
  title: string;
  organization: string;
  credibility: CredibilityTier;
  sourceUrl?: string;
  sectionHeading: string;
  updated: string;
  crops: string[];
  topics: string[];
  text: string;
}

/**
 * Citation contract surfaced to prompts and UI. `chunkId` is the retrieval
 * key; everything else is display/provenance metadata.
 */
export interface Citation {
  chunkId: string;
  documentId: string;
  title: string;
  organization: string;
  credibility: CredibilityTier;
  sourceUrl?: string;
  sectionHeading: string;
  updated: string;
}

export interface EvidenceBundle {
  chunks: Array<KnowledgeChunk & { score: number }>;
  citations: Citation[];
  /** True only when the corpus itself could not be loaded — never when a query simply has no strong matches. */
  unavailable: boolean;
}

export function citationFromChunk(chunk: KnowledgeChunk): Citation {
  return {
    chunkId: chunk.id,
    documentId: chunk.documentId,
    title: chunk.title,
    organization: chunk.organization,
    credibility: chunk.credibility,
    sourceUrl: chunk.sourceUrl,
    sectionHeading: chunk.sectionHeading,
    updated: chunk.updated,
  };
}
