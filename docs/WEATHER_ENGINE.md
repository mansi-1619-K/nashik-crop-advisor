# Weather Engine

> Status: **implemented (Phase 2)** · Live source: Open-Meteo (no API key required)

## Purpose

Turn raw forecast data into honest, agricultural weather intelligence — with
explicit provenance and heuristic (never diagnostic) advisory signals.

## Data flow

```
talukaId → coordinates (zone dataset, approximate centroids)
→ Open-Meteo forecast API (7-day, Asia/Kolkata)
→ Zod-validated response → typed WeatherBundle
→ in-memory cache (resilience fallback)
→ heuristic advisory signals   lib/agriculture/weatherRisk.ts
→ GET /api/weather response
```

## Components

| Module | Role |
| --- | --- |
| `lib/weather/openMeteo.ts` | URL builder, schema validation (`WeatherParseError`), fetch with 8s timeout (`WeatherFetchError`), injectable fetcher for tests |
| `lib/weather/parser.ts` | WMO code table → description + group (`clear/cloudy/fog/drizzle/rain/freezing-rain/snow/showers/thunderstorm`), `isWetCode` helper |
| `lib/weather/cache.ts` | taluka resolution, in-memory store (15-min freshness window), **fallback-only** semantics: live fetch always attempted first |
| `lib/agriculture/weatherRisk.ts` | rule-based advisory signal generation |

## Freshness contract (never fake liveness)

| Label | Meaning |
| --- | --- |
| `live` | Fetched from Open-Meteo on this request |
| `cached-fresh` | Upstream failed; serving memory cache < 15 min old |
| `cached-stale` | Upstream failed; serving cache older than 15 min |

The API response carries `provenance`: data source, class, `fetchedAt`, forecast
window, timezone, and an explicit warning string for stale responses. With no
cache available the endpoint returns **503 with no fabricated data**.

## Advisory signals (heuristics, not diagnoses)

All thresholds are documented engineering choices, not validated agronomy.

| Signal | Trigger | Severity ladder |
| --- | --- | --- |
| `excessive-rainfall` | daily precip ≥10/25/50 mm | low → moderate → high |
| `heat-stress` | tMax ≥37 °C / ≥40 °C | moderate / high |
| `fungal-risk-window` | humidity ≥78% + ≥2 wet days of next 3 | moderate; high at ≥85% RH & 20–30 °C |
| `spraying-suitability` | tomorrow wind <12 km/h, rain ≤30%, dry code | low (favorable info) |
| `high-wind-spraying-risk` | tomorrow wind ≥25 / ≥35 km/h | moderate / high |
| `irrigation-opportunity` | next 3 days dry (<2 mm, prob <35%) | low |
| `moisture-stress` | 4-day hot-dry stretch (tMax ≥34 °C) | moderate |

Each signal carries `{type, severity, confidence, reason, recommendedAction,
validUntil}`. Confidence follows forecast horizon (day ≤1 high, ≤3 medium,
beyond low). Language policy enforced by tests: *"conditions are favorable for
increased fungal disease pressure"* — never *"your crop has disease"*.

## Known limitations

- Taluka coordinates are approximate centroids (±few km orographic effects in the Ghats).
- Daily humidity means are not used; fungal rules combine current RH with wet-day codes.
- Cache is per-process memory; multi-instance deploys would need shared caching.
