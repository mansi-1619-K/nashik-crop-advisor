import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/recommend/route";
import { clearWeatherCache } from "@/lib/weather/cache";

const validContext = {
  zoneId: "central-irrigated",
  seasonId: "rabi",
  soilId: "medium-black",
  waterAvailability: "assured",
};

function request(body: unknown): Request {
  return new Request("http://localhost:3000/api/recommend", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => clearWeatherCache());

afterEach(() => {
  vi.unstubAllGlobals();
  clearWeatherCache();
});

describe("POST /api/recommend", () => {
  it("returns recommendations for a valid context", async () => {
    const response = await POST(request({ context: validContext }));
    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      primary: { cropId: string } | null;
      weatherAvailable: boolean;
    };
    expect(json.primary?.cropId).toBe("onion");
    expect(json.weatherAvailable).toBe(false);
  });

  it("upgrades confidence inputs when live weather is reachable for the taluka", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          latitude: 20.08,
          longitude: 74.11,
          timezone: "Asia/Kolkata",
          current: {
            time: "2026-08-22T10:00",
            temperature_2m: 28,
            relative_humidity_2m: 70,
            precipitation: 0,
            weather_code: 1,
            wind_speed_10m: 8,
          },
          daily: {
            time: ["2026-08-22"],
            weather_code: [1],
            temperature_2m_max: [30],
            temperature_2m_min: [21],
            precipitation_sum: [0],
            wind_speed_10m_max: [8],
          },
        }),
        { status: 200 },
      ),
    ));
    const response = await POST(request({ context: { ...validContext, talukaId: "niphad" } }));
    const json = (await response.json()) as { weatherAvailable: boolean };
    expect(json.weatherAvailable).toBe(true);
  });

  it("degrades gracefully when the weather lookup fails mid-request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const response = await POST(request({ context: { ...validContext, talukaId: "niphad" } }));
    expect(response.status).toBe(200);
    const json = (await response.json()) as { weatherAvailable: boolean };
    expect(json.weatherAvailable).toBe(false);
  });

  it("rejects invalid contexts with 400 and an error message", async () => {
    const response = await POST(
      request({ context: { ...validContext, seasonId: "monsoon" } }),
    );
    expect(response.status).toBe(400);
    const json = (await response.json()) as { error: string };
    expect(json.error).toMatch(/Invalid farmer context/i);
  });

  it("rejects a missing context field", async () => {
    const response = await POST(request({ hello: true }));
    expect(response.status).toBe(400);
  });

  it("rejects malformed JSON bodies with 400", async () => {
    const response = await POST(request("{not json"));
    expect(response.status).toBe(400);
  });
});
