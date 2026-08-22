import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as advisoryPOST } from "@/app/api/advisory/route";
import { POST as chatPOST } from "@/app/api/chat/route";
import { setGeminiGenerator } from "@/lib/ai/gemini";

const context = {
  zoneId: "central-irrigated",
  seasonId: "rabi",
  soilId: "medium-black",
  waterAvailability: "assured",
};

beforeEach(() => setGeminiGenerator(null));
afterEach(() => setGeminiGenerator(undefined));

function request(path: string, body: unknown): Request {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/advisory", () => {
  it("returns engine output plus a labelled fallback narrative when keyless", async () => {
    const response = await advisoryPOST(request("/api/advisory", { context }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.advisory.source).toBe("static");
    expect(json.advisory.narrative.summary).toContain("Onion");
    expect(json.aiConfiguredNote).toMatch(/GEMINI_API_KEY/);
    expect(json.engineVersion).toBeTruthy();
  });

  it("rejects invalid contexts", async () => {
    const response = await advisoryPOST(
      request("/api/advisory", { context: { ...context, zoneId: "atlantis" } }),
    );
    expect(response.status).toBe(400);
  });
});

describe("POST /api/chat", () => {
  it("answers keyless via deterministic rules", async () => {
    const response = await chatPOST(request("/api/chat", { context, question: "Why onion first?" }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.source).toBe("static");
    expect(json.answer.answer).toContain("#1");
  });

  it("keeps short conversation history", async () => {
    const response = await chatPOST(
      request("/api/chat", {
        context,
        question: "and water?",
        history: [
          { role: "user", content: "why onion?" },
          { role: "assistant", content: "Because of soil and water." },
          { role: "bogus", content: "dropped" },
        ],
      }),
    );
    const json = await response.json();
    expect(json.answer).toBeDefined();
  });

  it("rejects missing or oversized questions", async () => {
    expect((await chatPOST(request("/api/chat", { context }))).status).toBe(400);
    expect((await chatPOST(request("/api/chat", { context, question: "x".repeat(501) }))).status).toBe(400);
    expect((await chatPOST(request("/api/chat", { question: "hi" }))).status).toBe(400);
  });
});
