import { describe, expect, it } from "vitest";
import { generateWeatherSignals, type WeatherSignal } from "@/lib/agriculture/weatherRisk";
import type { CurrentConditions, DailyForecastDay, WeatherBundle } from "@/lib/weather/types";

function day(overrides: Partial<DailyForecastDay>, index: number): DailyForecastDay {
  return {
    date: `2026-08-${22 + index}`,
    weatherCode: 0,
    tempMaxC: 30,
    tempMinC: 20,
    precipitationSumMm: 0,
    precipitationProbabilityMaxPercent: 10,
    windMaxKmh: 8,
    ...overrides,
  };
}

function bundle(
  days: Array<Partial<DailyForecastDay>>,
  current: Partial<CurrentConditions> = {},
): WeatherBundle {
  const fullDays = days.map((d, i) => day(d, i));
  return {
    location: { talukaId: "test", talukaName: "Test", lat: 20, lng: 74 },
    current: {
      observedAt: "2026-08-22T10:00",
      temperatureC: 27,
      apparentTemperatureC: null,
      humidityPercent: 60,
      precipitationMm: 0,
      weatherCode: 0,
      windKmh: 8,
      ...current,
    },
    daily: fullDays,
    timezone: "Asia/Kolkata",
    fetchedAt: "2026-08-22T10:00:00Z",
    source: "open-meteo",
    sourceClass: "live",
  };
}

function signalOf(signals: WeatherSignal[], type: WeatherSignal["type"]): WeatherSignal | undefined {
  return signals.find((s) => s.type === type);
}

describe("weather risk heuristics", () => {
  it("flags heavy rainfall as a high-severity advisory", () => {
    const signals = generateWeatherSignals(
      bundle([{ precipitationSumMm: 60, weatherCode: 65 }, {}, {}, {}, {}, {}, {}]),
    );
    const rain = signalOf(signals, "excessive-rainfall");
    expect(rain?.severity).toBe("high");
    expect(rain?.reason).toContain("60 mm");
    expect(rain?.recommendedAction.toLowerCase()).toContain("drainage");
  });

  it("flags moderate rainfall for notable but sub-50mm events", () => {
    const signals = generateWeatherSignals(
      bundle([{ precipitationSumMm: 30 }, {}, {}, {}, {}, {}, {}]),
    );
    expect(signalOf(signals, "excessive-rainfall")?.severity).toBe("moderate");
  });

  it("escalates heat stress with temperature bands", () => {
    const moderate = generateWeatherSignals(bundle([{ tempMaxC: 38 }, {}, {}, {}, {}, {}, {}]));
    expect(signalOf(moderate, "heat-stress")?.severity).toBe("moderate");

    const high = generateWeatherSignals(bundle([{ tempMaxC: 41 }, {}, {}, {}, {}, {}, {}]));
    expect(signalOf(high, "heat-stress")?.severity).toBe("high");
  });

  it("emits fungal-risk advisories with careful non-diagnostic language", () => {
    const wetDays = [
      { weatherCode: 63, precipitationSumMm: 15, precipitationProbabilityMaxPercent: 90 },
      { weatherCode: 61, precipitationSumMm: 8, precipitationProbabilityMaxPercent: 80 },
      { weatherCode: 53, precipitationSumMm: 3, precipitationProbabilityMaxPercent: 70 },
    ];
    const signals = generateWeatherSignals(bundle(wetDays, { humidityPercent: 88 }));
    const fungal = signalOf(signals, "fungal-risk-window");
    expect(fungal).toBeDefined();
    expect(fungal!.severity).toBe("high");
    expect(fungal!.reason).toMatch(/favorable/i);
    expect(fungal!.recommendedAction).toMatch(/not a disease diagnosis/i);
    expect(fungal!.reason).not.toMatch(/your crop has|infection confirmed/i);
  });

  it("recommends a spray window on calm dry days", () => {
    const signals = generateWeatherSignals(
      bundle([{ windMaxKmh: 9, precipitationProbabilityMaxPercent: 5, weatherCode: 1 }, {}, {}, {}, {}, {}, {}]),
    );
    const spray = signalOf(signals, "spraying-suitability");
    expect(spray?.severity).toBe("low");
    expect(spray?.confidence).toBe("high");
  });

  it("warns against spraying under strong winds", () => {
    const signals = generateWeatherSignals(bundle([{ windMaxKmh: 38 }, {}, {}, {}, {}, {}, {}]));
    const wind = signalOf(signals, "high-wind-spraying-risk");
    expect(wind?.severity).toBe("high");
    expect(wind?.recommendedAction.toLowerCase()).toContain("avoid spraying");
  });

  it("suggests an irrigation opportunity during a dry stretch", () => {
    const signals = generateWeatherSignals(bundle([{}, {}, {}, {}, {}, {}, {}]));
    const irrigation = signalOf(signals, "irrigation-opportunity");
    expect(irrigation).toBeDefined();
    expect(signalOf(signals, "excessive-rainfall")).toBeUndefined();
  });

  it("adds a moisture-stress watch when the dry spell is also hot", () => {
    const hotDry = [0, 1, 2, 3].map(() => ({ tempMaxC: 35 }));
    const signals = generateWeatherSignals(bundle([...hotDry, {}, {}, {}]));
    const stress = signalOf(signals, "moisture-stress");
    expect(stress?.severity).toBe("moderate");
  });

  it("returns no signals for an empty forecast", () => {
    expect(generateWeatherSignals(bundle([]))).toEqual([]);
  });

  it("always includes validUntil timestamps in IST end-of-day form", () => {
    const signals = generateWeatherSignals(
      bundle([{ precipitationSumMm: 55 }, {}, {}, {}, {}, {}, {}]),
    );
    for (const s of signals) {
      expect(s.validUntil).toMatch(/T23:59:59\+05:30$/);
    }
  });
});
