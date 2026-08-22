import { getAgricultureDatasets } from "@/lib/agriculture/datasets";
import {
  fetchWeatherForPoint,
  WeatherFetchError,
  WeatherParseError,
} from "./openMeteo";
import type { GeoPoint, WeatherBundle, WeatherFreshness } from "./types";

export class TalukaNotFoundError extends Error {
  constructor(talukaId: string) {
    super(`Unknown taluka "${talukaId}" in the zone dataset.`);
  }
}

const FRESH_TTL_MS = 15 * 60 * 1000;

interface CacheEntry {
  bundle: WeatherBundle;
  cachedAt: number;
}

const store = new Map<string, CacheEntry>();

export function clearWeatherCache(): void {
  store.clear();
}

export function peekCached(talukaId: string): CacheEntry | undefined {
  return store.get(talukaId);
}

export function resolveTalukaPoint(talukaId: string): GeoPoint {
  const datasets = getAgricultureDatasets();
  for (const zone of datasets.zones.zones) {
    const taluka = zone.talukas.find((t) => t.id === talukaId);
    if (taluka) {
      return { talukaId: taluka.id, talukaName: taluka.name, lat: taluka.lat, lng: taluka.lng };
    }
  }
  throw new TalukaNotFoundError(talukaId);
}

export async function getWeather(
  talukaId: string,
  options: { fetcher?: typeof globalThis.fetch; timeoutMs?: number } = {},
): Promise<{ bundle: WeatherBundle; freshness: WeatherFreshness }> {
  const point = resolveTalukaPoint(talukaId);

  try {
    const bundle = await fetchWeatherForPoint(point.lat, point.lng, options);
    bundle.location = point;
    store.set(talukaId, { bundle, cachedAt: Date.now() });
    return { bundle, freshness: "live" };
  } catch (error) {
    if (error instanceof TalukaNotFoundError) throw error;
    const entry = store.get(talukaId);
    if (!entry) {
      throw error instanceof WeatherFetchError || error instanceof WeatherParseError
        ? error
        : new WeatherFetchError(`Weather unavailable and no cache exists: ${String(error)}`, error);
    }
    const isStale = Date.now() - entry.cachedAt > FRESH_TTL_MS;
    return { bundle: entry.bundle, freshness: isStale ? "cached-stale" : "cached-fresh" };
  }
}

export function getCachedOrThrow(talukaId: string): { bundle: WeatherBundle; freshness: WeatherFreshness } | null {
  const entry = store.get(talukaId);
  if (!entry) return null;
  const isStale = Date.now() - entry.cachedAt > FRESH_TTL_MS;
  return { bundle: entry.bundle, freshness: isStale ? "cached-stale" : "cached-fresh" };
}
