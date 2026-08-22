import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/recommend/route";

const validContext = {
  zoneId: "central-irrigated",
  seasonId: "rabi",
  soilId: "medium-black",
  waterAvailability: "assured",
};

function request(body: string) {
  return new Request("http://localhost:3000/api/recommend", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/recommend", () => {
  it("returns recommendations for a valid context", async () => {
    const response = await POST(request(JSON.stringify(validContext)));
    expect(response.status).toBe(200);
    const json = (await response.json()) as { primary: { cropId: string } | null };
    expect(json.primary?.cropId).toBe("onion");
  });

  it("rejects invalid contexts with 400 and an error message", async () => {
    const response = await POST(request(JSON.stringify({ ...validContext, seasonId: "monsoon" })));
    expect(response.status).toBe(400);
    const json = (await response.json()) as { error: string };
    expect(json.error).toMatch(/Invalid farmer context/i);
  });

  it("rejects malformed JSON bodies with 400", async () => {
    const response = await POST(request("{not json"));
    expect(response.status).toBe(400);
  });
});
