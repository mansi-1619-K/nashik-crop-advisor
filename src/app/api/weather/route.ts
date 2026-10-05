import { NextRequest, NextResponse } from "next/server";
import type { RegionKey, WeatherResponse } from "@/lib/types";
import { REGIONS } from "@/lib/constants";
import {
  buildWeatherUrl,
  buildFallbackResponse,
  mapWeatherResponse,
  type OpenMeteoResponse,
} from "@/lib/weather-utils";

export const dynamic = "force-dynamic";

/* --- Phase 7.5 — bounded, deduplicated upstream -------------------------
   Open-Meteo hung for 8–10s per call in practice (plan 7.5). Three guards:
   1. a 6s AbortSignal so a dead upstream resolves into the local fallback
      instead of holding the spinner;
   2. an in-memory TTL cache (works identically in dev and prod — the
      Next data-cache alone is a no-op in dev, where every region flip
      re-fetched);
   3. an in-flight map so rapid region toggles share one upstream call.
   Successful payloads live 5 minutes; fallbacks only 60s so a recovered
   upstream is picked up on the next refresh. */
const UPSTREAM_TIMEOUT_MS = 6000;
const SUCCESS_TTL_MS = 5 * 60_000;
const FALLBACK_TTL_MS = 60_000;

const responseCache = new Map<
  RegionKey,
  { body: WeatherResponse; expires: number }
>();
const inflight = new Map<RegionKey, Promise<WeatherResponse>>();

async function fetchRegionWeather(region: RegionKey): Promise<WeatherResponse> {
  const url = buildWeatherUrl(region);
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo responded with status ${res.status}`);
  }

  const raw = (await res.json()) as OpenMeteoResponse;
  return mapWeatherResponse(region, raw);
}

function getRegionWeather(region: RegionKey): Promise<WeatherResponse> {
  const pending = inflight.get(region);
  if (pending) return pending;

  const promise = fetchRegionWeather(region).finally(() => {
    inflight.delete(region);
  });
  inflight.set(region, promise);
  return promise;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") as RegionKey | null;

  if (!region || !REGIONS[region]) {
    return NextResponse.json(
      { error: "A valid 'region' query parameter is required." },
      { status: 400 },
    );
  }

  const cached = responseCache.get(region);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.body);
  }

  let body: WeatherResponse;
  let ttl = SUCCESS_TTL_MS;
  try {
    body = await getRegionWeather(region);
  } catch {
    body = buildFallbackResponse(region);
    ttl = FALLBACK_TTL_MS;
  }

  responseCache.set(region, { body, expires: Date.now() + ttl });
  return NextResponse.json(body);
}
