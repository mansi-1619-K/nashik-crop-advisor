import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/weather/route";
import { clearWeatherCache } from "@/lib/weather/cache";

function openMeteoPayload() {
  const time = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2026, 7, 22 + i)).toISOString().slice(0, 10),
  );
  return {
    latitude: 19.7,
    longitude: 73.56,
    timezone: "Asia/Kolkata",
    current: {
      time: "2026-08-22T10:00",
      temperature_2m: 27,
      relative_humidity_2m: 80,
      apparent_temperature: 29,
      precipitation: 0,
      weather_code: 2,
      wind_speed_10m: 8,
    },
    daily: {
      time,
      weather_code: [2, 61, 3, 0, 1, 80, 2],
      temperature_2m_max: [29, 26, 28, 31, 32, 30, 29],
      temperature_2m_min: [21, 20, 21, 22, 22, 21, 21],
      precipitation_sum: [0, 12, 0, 0, 0, 8, 0],
      precipitation_probability_max: [10, 85, 20, 5, 5, 70, 15],
      wind_speed_10m_max: [9, 14, 11, 8, 10, 16, 9],
    },
  };
}

function request(taluka?: string): Request {
  const url = new URL("http://localhost:3000/api/weather");
  if (taluka) url.searchParams.set("taluka", taluka);
  return new Request(url);
}

beforeEach(() => clearWeatherCache());

afterEach(() => {
  vi.unstubAllGlobals();
  clearWeatherCache();
});

describe("GET /api/weather", () => {
  it("returns live weather plus agricultural signals for a known taluka", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify(openMeteoPayload()), { status: 200 }),
    ));
    const response = await GET(request("igatpuri"));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.available).toBe(true);
    expect(json.freshness).toBe("live");
    expect(json.provenance.dataSource).toBe("Open-Meteo");
    expect(json.provenance.forecastWindow.to.length).toBe(10);
    expect(Array.isArray(json.signals)).toBe(true);
  });

  it("falls back to fresh cache when upstream later fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify(openMeteoPayload()), { status: 200 }),
    ));
    await GET(request("niphad"));

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const response = await GET(request("niphad"));
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.freshness).toBe("cached-fresh");
    expect(json.provenance.sourceClass).toBe("cached");
  });

  it("returns 503 with no fabricated data when there is no cache", async () => {
    clearWeatherCache();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const response = await GET(request("yeola"));
    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.available).toBe(false);
    expect(json.note).toMatch(/nothing is fabricated/i);
  });

  it("returns 404 for unknown talukas", async () => {
    const response = await GET(request("shirdi"));
    expect(response.status).toBe(404);
  });

  it("returns 400 when the taluka parameter is missing", async () => {
    const response = await GET(request());
    expect(response.status).toBe(400);
  });
});
