import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as advisoryPOST } from "@/app/api/advisory/route";
import { POST as chatPOST } from "@/app/api/chat/route";
import { setGeminiGenerator } from "@/lib/ai/gemini";
import { resetKnowledgeChunksForTests } from "@/lib/rag/corpus";

const context = {
  zoneId: "central-irrigated",
  seasonId: "rabi",
  soilId: "medium-black",
  waterAvailability: "assured",
};

beforeEach(() => {
  setGeminiGenerator(null);
  resetKnowledgeChunksForTests();
});

afterEach(() => setGeminiGenerator(undefined));

function request(path: string, body: unknown): Request {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("RAG-backed API flow (keyless)", () => {
  it("chat retrieves internal reference passages for storage questions", async () => {
    const response = await chatPOST(
      request("/api/chat", {
        context,
        question: "How should I cure and store my onions after harvest?",
      }),
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.source).toBe("static");
    expect(json.citations).toBeUndefined();
    expect(json.answer.answer).toBeTruthy();
  });

  it("advisory completes with retrieval wired in and no fabricated citations", async () => {
    const response = await advisoryPOST(request("/api/advisory", { context }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.advisory.source).toBe("static");
    expect(json.advisory.citations ?? []).toEqual([]);
    expect(json.advisory.narrative.summary).toContain("Onion");
  });

  it("still answers normally when the question has no corpus overlap", async () => {
    const response = await chatPOST(request("/api/chat", { context, question: "Why onion first?" }));
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.answer.answer).toContain("#1");
  });
});
