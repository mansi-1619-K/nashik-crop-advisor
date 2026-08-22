import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/simulate/route";

const validContext = {
  zoneId: "central-irrigated",
  seasonId: "rabi",
  soilId: "medium-black",
  waterAvailability: "assured",
};

function request(body: unknown): Request {
  return new Request("http://localhost:3000/api/simulate", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/simulate", () => {
  it("returns a full sensitivity report for a valid context", async () => {
    const response = await POST(request({ context: validContext }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.basePrimaryCropId).toBe("onion");
    expect(json.rows).toHaveLength(6);
    expect(json.notes.length).toBeGreaterThan(0);
    expect(json.contextSummary).toMatch(/Central/i);
  });

  it("accepts custom scenarios", async () => {
    const response = await POST(
      request({
        context: validContext,
        scenarios: [
          { id: "base", label: "Base", overrides: {} },
          { id: "cost-plus-50", label: "Cost +50%", overrides: { costFactor: 1.5 } },
        ],
      }),
    );
    const json = await response.json();
    expect(json.rows).toHaveLength(2);
    expect(json.totalScenarios).toBe(1);
  });

  it("rejects missing context with 400", async () => {
    const response = await POST(request({}));
    expect(response.status).toBe(400);
  });

  it("rejects invalid contexts with 400", async () => {
    const response = await POST(request({ context: { ...validContext, zoneId: "moon" } }));
    expect(response.status).toBe(400);
  });

  it("rejects malformed JSON bodies with 400", async () => {
    const response = await POST(request("{oops"));
    expect(response.status).toBe(400);
  });
});
