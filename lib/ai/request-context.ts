import { farmerContextSchema } from "@/lib/agriculture/context";
import { generateRecommendations } from "@/lib/agriculture/recommend";
import { generateWeatherSignals, type WeatherSignal } from "@/lib/agriculture/weatherRisk";
import { getWeather } from "@/lib/weather/cache";
import type { RecommendationOutput } from "@/lib/agriculture/results";

export type EngineRunResult =
  | {
      ok: false;
      status: number;
      error: string;
    }
  | {
      ok: true;
      engine: RecommendationOutput;
      contextSummary: string;
      weatherSignals?: WeatherSignal[];
      weatherFreshness?: string;
    };

export async function runEngineForRequest(body: unknown): Promise<EngineRunResult> {
  const { context } = (body ?? {}) as { context?: unknown };
  if (typeof context !== "object" || context === null) {
    return { ok: false, status: 400, error: "Missing required field: context." };
  }

  const parsed = farmerContextSchema.safeParse(context);
  if (!parsed.success) {
    return { ok: false, status: 400, error: `Invalid farmer context: ${parsed.error.message}` };
  }

  let weatherSignals: WeatherSignal[] | undefined;
  let weatherFreshness: string | undefined;
  const talukaId = (context as { talukaId?: unknown }).talukaId;
  if (typeof talukaId === "string" && talukaId.length > 0) {
    try {
      const weather = await getWeather(talukaId, { timeoutMs: 4000 });
      weatherSignals = generateWeatherSignals(weather.bundle);
      weatherFreshness = weather.freshness;
    } catch {
      weatherSignals = undefined;
    }
  }

  const engine = generateRecommendations(parsed.data, { weatherAvailable: Boolean(weatherFreshness) });
  return {
    ok: true,
    engine,
    contextSummary: engine.contextSummary,
    weatherSignals,
    weatherFreshness,
  };
}

export function sanitizeHistory(raw: unknown): Array<{ role: "user" | "assistant"; content: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        typeof m === "object" &&
        m !== null &&
        ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") &&
        typeof (m as { content?: unknown }).content === "string",
    )
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
}
