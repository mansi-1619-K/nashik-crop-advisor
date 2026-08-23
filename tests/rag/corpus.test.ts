import { describe, expect, it } from "vitest";
import { buildChunks, getKnowledgeChunks, resetKnowledgeChunksForTests } from "@/lib/rag/corpus";

describe("knowledge corpus contract", () => {
  it("loads and validates the seed handbook", () => {
    const chunks = getKnowledgeChunks();
    expect(chunks.length).toBeGreaterThanOrEqual(20);
    for (const chunk of chunks) {
      expect(chunk.id).toMatch(/^[a-z0-9-]+#\d+$/);
      expect(chunk.text.length).toBeGreaterThan(20);
      expect(chunk.text.length).toBeLessThanOrEqual(900);
      expect(chunk.credibility).toBe("internal");
      expect(chunk.topics.length).toBeGreaterThan(0);
    }
  });

  it("keeps chunk ids unique and stable across rebuilds", () => {
    const first = getKnowledgeChunks().map((c) => c.id);
    resetKnowledgeChunksForTests();
    const second = getKnowledgeChunks().map((c) => c.id);
    expect(new Set(first).size).toBe(first.length);
    expect(first).toEqual(second);
  });

  it("splits over-long paragraphs on sentence boundaries", () => {
    const longSentence = "This is one long sentence about irrigation practice. ".repeat(30);
    const doc = {
      id: "test-doc",
      title: "Test Document",
      organization: "Test Org",
      credibility: "internal" as const,
      updated: "2026-08-23",
      crops: [],
      topics: ["testing"],
      content: [{ heading: "Heading", paragraphs: [longSentence] }],
    };
    const chunks = buildChunks(doc);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.text.startsWith("Test Document — Heading: ")).toBe(true);
      expect(chunk.sectionHeading).toBe("Heading");
    }
  });

  it("prefixes every chunk with title and section heading", () => {
    const doc = {
      id: "two-sections",
      title: "Two Sections",
      organization: "Org",
      credibility: "internal" as const,
      updated: "2026-08-23",
      crops: ["onion"],
      topics: ["storage"],
      content: [
        { heading: "Curing", paragraphs: ["Cure bulbs in shade."] },
        { heading: "Storage", paragraphs: ["Ventilate continuously."] },
      ],
    };
    const chunks = buildChunks(doc);
    expect(chunks.map((c) => c.id)).toEqual(["two-sections#0", "two-sections#1"]);
    expect(chunks[0].text).toContain("Two Sections — Curing:");
    expect(chunks[1].text).toContain("Storage");
  });
});
