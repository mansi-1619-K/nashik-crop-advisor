import { NextResponse } from "next/server";
import { getWeather, TalukaNotFoundError } from "@/lib/weather/cache";
import { WeatherFetchError, WeatherParseError } from "@/lib/weather/openMeteo";
import { generateWeatherSignals } from "@/lib/agriculture/weatherRisk";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const talukaId = url.searchParams.get("taluka");
  if (!talukaId) {
    return NextResponse.json(
      { error: "Missing required query parameter: taluka", available: false },
      { status: 400 },
    );
  }

  try {
    const { bundle, freshness } = await getWeather(talukaId);
    const signals = generateWeatherSignals(bundle);
    return NextResponse.json({
      available: true,
      freshness,
      weather: bundle,
      signals,
      provenance: {
        dataSource: "Open-Meteo",
        sourceClass: freshness === "live" ? "live" : "cached",
        fetchedAt: bundle.fetchedAt,
        forecastWindow:
          bundle.daily.length > 0
            ? { from: bundle.daily[0].date, to: bundle.daily[bundle.daily.length - 1].date }
            : null,
        timezone: bundle.timezone,
        note:
          freshness === "cached-stale"
            ? "STALE CACHE — upstream fetch failed; data may be outdated and is NOT live."
            : undefined,
      },
    });
  } catch (error) {
    if (error instanceof TalukaNotFoundError) {
      return NextResponse.json({ error: error.message, available: false }, { status: 404 });
    }
    if (error instanceof WeatherFetchError || error instanceof WeatherParseError) {
      return NextResponse.json(
        {
          error: `Weather service unavailable: ${error.message}`,
          available: false,
          note: "No cached data exists for this location; nothing is fabricated in place of live data.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Unexpected weather service error.", available: false },
      { status: 500 },
    );
  }
}
