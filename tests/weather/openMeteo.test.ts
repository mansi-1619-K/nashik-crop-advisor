import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildForecastUrl,
  fetchWeatherForPoint,
  WeatherFetchError,
  WeatherParseError,
} from "@/lib/weather/openMeteo";
import { clearWeatherCache, getWeather, peekCached } from "@/lib/weather/cache";

function openMeteoPayload() {
  const time = Array.from({ length: 7 }, (_, i) => `2026-08-2${2 + i}`.slice(0, 10)).map((d, i) =>
    new Date(Date.UTC(2026, 7, 22 + i)).toISOString().slice(0, 10),
  );
  return {
    latitude: 19.7,
    longitude: 73.56,
    timezone: "Asia/Kolkata",
    current: {
      time: "2026-08-22T10:00",
      temperature_2m: 27.4,
      relative_humidity_2m: 84,
      apparent_temperature: 30.1,
      precipitation: 0,
      weather_code: 2,
      wind_speed_10m: 9.3,
    },
    daily: {
      time,
      weather_code: [2, 61, 3, 0, 1, 80, 2],
      temperature_2m_max: [29, 26, 28, 31, 32, 30, 29],
      temperature_2m_min: [21, 20, 21, 22, 22, 21, 21],
      precipitation_sum: [0, 12.5, 0, 0, 0, 8, 0],
      precipitation_probability_max: [10, 85, 20, 5, 5, 70, 15],
      wind_speed_10m_max: [9, 14, 11, 8, 10, 16, 9],
    },
  };
}

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearWeatherCache();
});

describe("Open-Meteo client", () => {
  it("builds a forecast URL with Nashik timezone and 7 forecast days", () => {
    const url = buildForecastUrl(19.7, 73.56);
    expect(url).toContain("latitude=19.7");
    expect(url).toContain("timezone=Asia%2FKolkata");
    expect(url).toContain("forecast_days=7");
    expect(url).toContain("temperature_2m_max");
  });

  it("maps a valid response into a typed bundle", async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse(openMeteoPayload()));
    const bundle = await fetchWeatherForPoint(19.7, 73.56, { fetcher });
    expect(bundle.current.humidityPercent).toBe(84);
    expect(bundle.daily).toHaveLength(7);
    expect(bundle.daily[1].precipitationSumMm).toBeCloseTo(12.5);
    expect(bundle.daily[1].precipitationProbabilityMaxPercent).toBe(85);
    expect(bundle.source).toBe("open-meteo");
  });

  it("throws WeatherFetchError on HTTP failure", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("boom", { status: 500 }));
    await expect(fetchWeatherForPoint(19.7, 73.56, { fetcher })).rejects.toBeInstanceOf(
      WeatherFetchError,
    );
  });

  it("throws WeatherFetchError when the network fails", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(fetchWeatherForPoint(19.7, 73.56, { fetcher })).rejects.toBeInstanceOf(
      WeatherFetchError,
    );
  });

  it("throws WeatherParseError for malformed JSON", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("{not json", { status: 200 }));
    await expect(fetchWeatherForPoint(19.7, 73.56, { fetcher })).rejects.toBeInstanceOf(
      WeatherParseError,
    );
  });

  it("throws WeatherParseError when the schema does not match", async () => {
    const payload = openMeteoPayload() as Record<string, unknown>;
    delete payload.current;
    const fetcher = vi.fn().mockResolvedValue(okResponse(payload));
    await expect(fetchWeatherForPoint(19.7, 73.56, { fetcher })).rejects.toBeInstanceOf(
      WeatherParseError,
    );
  });
});

describe("weather cache and fallback", () => {
  it("resolves taluka coordinates from the zone dataset", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(openMeteoPayload())));
    const { bundle, freshness } = await getWeather("igatpuri");
    expect(freshness).toBe("live");
    expect(bundle.location.talukaId).toBe("igatpuri");
    expect(bundle.location.lat).toBeCloseTo(19.7, 1);
  });

  it("serves fresh cache when upstream fails after a successful fetch", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(openMeteoPayload())));
    await getWeather("niphad");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new WeatherFetchError("upstream down")),
    );
    const second = await getWeather("niphad");
    expect(second.freshness).toBe("cached-fresh");
  });

  it("labels cache as stale once the TTL has elapsed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse(openMeteoPayload())));
    await getWeather("malegaon");

    const entry = peekCached("malegaon");
    expect(entry).toBeDefined();
    entry!.cachedAt = Date.now() - 16 * 60 * 1000;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new WeatherFetchError("upstream down")),
    );
    const result = await getWeather("malegaon");
    expect(result.freshness).toBe("cached-stale");
  });

  it("propagates the fetch error when no cache exists", async () => {
    clearWeatherCache();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new WeatherFetchError("upstream down")),
    );
    await expect(getWeather("yeola")).rejects.toBeInstanceOf(WeatherFetchError);
  });
});
