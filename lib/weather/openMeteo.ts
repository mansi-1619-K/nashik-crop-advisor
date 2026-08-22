import { z } from "zod";
import type { CurrentConditions, DailyForecastDay, WeatherBundle } from "./types";

export class WeatherFetchError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "WeatherFetchError";
  }
}

export class WeatherParseError extends Error {
  constructor(
    message: string,
    public readonly issues: string,
  ) {
    super(message);
    this.name = "WeatherParseError";
  }
}

const openMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    apparent_temperature: z.number().optional(),
    precipitation: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_sum: z.array(z.number()),
    precipitation_probability_max: z.array(z.number().nullable()).optional(),
    wind_speed_10m_max: z.array(z.number()),
  }),
});

export type OpenMeteoResponse = z.infer<typeof openMeteoResponseSchema>;

export interface OpenMeteoClientOptions {
  fetcher?: typeof globalThis.fetch;
  timeoutMs?: number;
  baseUrl?: string;
}

export function buildForecastUrl(lat: number, lng: number, baseUrl = "https://api.open-meteo.com"): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
    forecast_days: "7",
    timezone: "Asia/Kolkata",
  });
  return `${baseUrl}/v1/forecast?${params.toString()}`;
}

function toCurrent(raw: OpenMeteoResponse["current"]): CurrentConditions {
  return {
    observedAt: raw.time,
    temperatureC: raw.temperature_2m,
    apparentTemperatureC: raw.apparent_temperature ?? null,
    humidityPercent: raw.relative_humidity_2m,
    precipitationMm: raw.precipitation,
    weatherCode: raw.weather_code,
    windKmh: raw.wind_speed_10m,
  };
}

function toDaily(raw: OpenMeteoResponse["daily"]): DailyForecastDay[] {
  const n = raw.time.length;
  const pick = (arr: Array<number | null> | undefined, i: number): number | null =>
    arr && arr[i] !== undefined && arr[i] !== null ? (arr[i] as number) : null;
  const days: DailyForecastDay[] = [];
  for (let i = 0; i < n; i++) {
    days.push({
      date: raw.time[i],
      weatherCode: raw.weather_code[i] ?? -1,
      tempMaxC: raw.temperature_2m_max[i] ?? Number.NaN,
      tempMinC: raw.temperature_2m_min[i] ?? Number.NaN,
      precipitationSumMm: raw.precipitation_sum[i] ?? 0,
      precipitationProbabilityMaxPercent: pick(raw.precipitation_probability_max, i),
      windMaxKmh: raw.wind_speed_10m_max[i] ?? Number.NaN,
    });
  }
  return days.filter((d) => !Number.isNaN(d.tempMaxC) && !Number.isNaN(d.windMaxKmh));
}

export async function fetchWeatherForPoint(
  lat: number,
  lng: number,
  options: OpenMeteoClientOptions = {},
): Promise<WeatherBundle> {
  const { fetcher = globalThis.fetch, timeoutMs = 8000, baseUrl } = options;
  const url = buildForecastUrl(lat, lng, baseUrl);

  let response: Response;
  try {
    response = await fetcher(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: "application/json" },
    });
  } catch (error) {
    throw new WeatherFetchError(
      `Failed to reach Open-Meteo: ${error instanceof Error ? error.message : "unknown error"}`,
      error,
    );
  }

  if (!response.ok) {
    throw new WeatherFetchError(`Open-Meteo returned HTTP ${response.status}`);
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch (error) {
    throw new WeatherParseError("Open-Meteo returned non-JSON body", String(error));
  }

  const parsed = openMeteoResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new WeatherParseError("Open-Meteo response failed schema validation", parsed.error.message);
  }

  return {
    location: { talukaId: "", talukaName: "", lat: parsed.data.latitude, lng: parsed.data.longitude },
    current: toCurrent(parsed.data.current),
    daily: toDaily(parsed.data.daily),
    timezone: parsed.data.timezone,
    fetchedAt: new Date().toISOString(),
    source: "open-meteo",
    sourceClass: "live",
  };
}
