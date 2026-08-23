import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEvidenceRetriever, tokenize } from "@/lib/rag/retrieve";
import { setEvidenceRetriever } from "@/lib/rag/retrieve";
import { getKnowledgeChunks } from "@/lib/rag/corpus";
import type { KnowledgeChunk } from "@/lib/rag/types";

function chunk(overrides: Partial<KnowledgeChunk>): KnowledgeChunk {
  return {
    id: "doc#0",
    documentId: "doc",
    title: "Doc",
    organization: "Org",
    credibility: "internal",
    sectionHeading: "Section",
    updated: "2026-08-23",
    crops: [],
    topics: [],
    text: "Doc — Section: body text",
    ...overrides,
  };
}

beforeEach(() => setEvidenceRetriever(undefined));
afterEach(() => setEvidenceRetriever(undefined));

describe("tokenize", () => {
  it("lowercases, strips punctuation and removes stopwords", () => {
    expect(tokenize("Why should I store ONIONS after harvest?")).toEqual([
      "store",
      "onions",
      "after",
      "harvest",
    ]);
  });
});

describe("createEvidenceRetriever", () => {
  it("returns empty bundle (not unavailable) when nothing matches", () => {
    const retriever = createEvidenceRetriever(() => [
      chunk({ text: "Doc — Section: grape trellis details", topics: ["trellis"] }),
    ]);
    const result = retriever.retrieve("quantum flux capacitor");
    expect(result.chunks).toEqual([]);
    expect(result.citations).toEqual([]);
    expect(result.unavailable).toBe(false);
  });

  it("marks the bundle unavailable when the corpus fails to load", () => {
    const retriever = createEvidenceRetriever(() => {
      throw new Error("disk gone");
    });
    const result = retriever.retrieve("onion storage");
    expect(result.unavailable).toBe(true);
    expect(result.chunks).toEqual([]);
  });

  it("ranks on-topic chunks above unrelated ones and honours topK", () => {
    const retriever = createEvidenceRetriever(getKnowledgeChunks);
    const result = retriever.retrieve("how should I cure and store onions to reduce spoilage?", {
      topK: 3,
    });
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.chunks.length).toBeLessThanOrEqual(3);
    expect(result.citations[0]?.documentId).toBe("onion-curing-storage");
    for (let i = 1; i < result.chunks.length; i++) {
      expect(result.chunks[i - 1].score).toBeGreaterThanOrEqual(result.chunks[i].score);
    }
  });

  it("matches crop tags so crop-name queries retrieve that crop's guidance", () => {
    const retriever = createEvidenceRetriever(getKnowledgeChunks);
    const result = retriever.retrieve("pomegranate orchard care", { topK: 2 });
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(
      result.chunks.some((c) => c.documentId === "pomegranate-bacterial-blight-prevention"),
    ).toBe(true);
  });

  it("prefers higher credibility tiers when scores tie", () => {
    const retriever = createEvidenceRetriever(() => [
      chunk({ id: "internal#0", documentId: "internal", credibility: "internal" }),
      chunk({ id: "icar#0", documentId: "icar-doc", credibility: "icar" }),
    ]);
    const result = retriever.retrieve("doc section body", { topK: 2 });
    expect(result.chunks[0].documentId).toBe("icar-doc");
  });

  it("dedupes citations per document while keeping all chunk hits", () => {
    const retriever = createEvidenceRetriever(() => [
      chunk({ id: "a#0", documentId: "a" }),
      chunk({ id: "a#1", documentId: "a" }),
      chunk({ id: "b#0", documentId: "b" }),
    ]);
    const result = retriever.retrieve("doc section body", { topK: 3 });
    expect(result.chunks.length).toBe(3);
    expect(result.citations.map((c) => c.documentId)).toEqual(["a", "b"]);
  });

  it("handles stopword-only queries gracefully", () => {
    const retriever = createEvidenceRetriever(getKnowledgeChunks);
    const result = retriever.retrieve("the a of and");
    expect(result.chunks).toEqual([]);
    expect(result.unavailable).toBe(false);
  });
});
