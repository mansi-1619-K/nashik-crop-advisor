# PHASE 2 REPORT — Weather + Economics

**Date:** 2026-08-22 · **Status:** ✅ Complete · **All gates passed**

## Objective

Wire the system to the real world: live weather via Open-Meteo, agricultural
advisory signals derived from forecasts, a transparent economic engine, and a
market data abstraction — with failure resilience and honest provenance
everywhere.

## Delivered

### Weather engine (`lib/weather/`, `app/api/weather`)
| Piece | Detail |
| --- | --- |
| Open-Meteo client | 7-day forecast + current conditions, Asia/Kolkata timezone; Zod response validation; typed `WeatherFetchError`/`WeatherParseError`; 8s timeout; injectable fetcher for tests |
| WMO parser | full code table → descriptions + groups (clear/cloudy/fog/drizzle/rain/freezing-rain/snow/showers/thunderstorm) with safe unknown-code fallback |
| Cache | in-memory, 15-min freshness window, **fallback-only**: upstream is always tried first; stale entries served only when upstream fails — always labelled |
| API route | `GET /api/weather?taluka=<id>` → bundle + signals + provenance (`dataSource`, class, `fetchedAt`, forecast window); 404 unknown taluka; **503 + no fabricated data** when unavailable |

### Weather → agricultural intelligence (`lib/agriculture/weatherRisk.ts`)
Seven heuristic advisory rules with documented thresholds: excessive-rainfall,
heat-stress, fungal-risk-window, spraying-suitability, high-wind-spraying-risk,
irrigation-opportunity, moisture-stress. Each signal carries severity, horizon-
based confidence, numeric reason, recommended action, and an IST `validUntil`.
Language policy ("favorable for increased fungal disease pressure", never
diagnosis) is enforced by tests.

### Economics (`lib/agriculture/economics.ts`) + market abstraction (`lib/market/`)
- Point estimator `computeEconomics()`: gross revenue, net return, break-even
  price, ROI — each input carrying `{value, sourceClass, basis}` with priority:
  user override (`user_provided`) → market quote (`live`/`static`) → dataset
  midpoint (`estimated`); optional area scaling.
- Range estimator retained from Phase 1.
- `MarketProvider` interface + `StaticSampleMarketProvider`; swap-in point ready
  for AGMARKNET/APMC feeds. Sample quotes explicitly "not a live observation".

## Verification gate

| Check | Result |
| --- | --- |
| `npm test` | ✅ **83/83** (38 new: parser 3, client+cache 10, weatherRisk 10, economics 6, provider 3, weather API 5) |
| typecheck / lint / build | ✅ clean (`/api/weather` dynamic route) |
| **Live smoke vs real Open-Meteo** | ✅ `igatpuri` → freshness `live`, 22.1 °C / 100 % RH / 12.5 km/h, window 2026-08-22→28, signal `fungal-risk-window/high` — exactly right for peak-monsoon Ghats conditions |
| Failure paths | ✅ upstream-down → cached-fresh/stale labels or honest 503; malformed payload → schema error; unknown taluka → 404 |

## Key design decisions

1. **Fallback-only cache** — maximum freshness by default; cache exists so the app
   degrades gracefully rather than to reduce API calls. Labels make the state
   unambiguous.
2. **Horizon-based confidence** on signals — day-1 rules are "high" confidence,
   day-5+ rules are "low"; prevents over-trusting long-range forecasts.
3. **Signals are pure functions of the bundle** — deterministic, trivially
   testable, and later reusable inside crop recommendations.
4. **Source-class plumbing into economics** — every monetary figure knows whether
   it came from the farmer, a quote, or an assumption.

## Known gaps / deferred

- Dashboard still renders placeholders; wiring `/api/recommend` + `/api/weather`
  into the UI lands next (Phase 3 includes simulator/explainability UI).
- Daily humidity means unused; fungal rule combines current RH with wet-day codes.
- Single-process memory cache only.

## Phase 3 entry criteria — met

Weather bundles and signals flow through one tested path; economics produce fully
sourced numbers. Confidence/explainability/sensitivity work can now consume them.
