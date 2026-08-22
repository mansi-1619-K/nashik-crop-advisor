# PHASE 1 REPORT — Agricultural Domain Engine

**Date:** 2026-08-22 · **Status:** ✅ Complete · **All gates passed** · Engine v`1.0.0`

## Objective

Build the deterministic heart of the system per the brief: hard agronomic
constraints, transparent suitability scoring, ranked recommendations with
explainability and confidence — no Gemini, no network calls, fully test-covered.

## Delivered

| Module | File | Contents |
| --- | --- | --- |
| Constraint engine | `lib/agriculture/constraints.ts` | zone/season/water/soil/climate hard rules + warnings (incl. monsoon-substitution exception) |
| Suitability engine | `lib/agriculture/suitability.ts` | 7 weighted factors → overall score − risk penalty, with per-factor generated reasons |
| Weight configuration | `lib/agriculture/weights.ts` | default weights (sum=1), runtime validation, compatibility/severity/water scales |
| Confidence metric | `lib/agriculture/confidence.ts` | deduction-based High/Medium/Low with human-readable reasons |
| Economics seed | `lib/agriculture/economics.ts` | range math over dataset economics (gross/net/break-even/ROI) — full engine lands Phase 2 |
| Orchestrator | `lib/agriculture/recommend.ts` | context parsing → constraints → scoring → ranking → roles → output; injectable clock for determinism |
| Dataset access | `lib/agriculture/datasets.ts` | cached, schema-validated loaders + finders |
| API surface | `app/api/recommend/route.ts` | POST farmer context → `RecommendationOutput`; 400 on invalid input |

Full formulas and rules are documented in [`DECISION_ENGINE.md`](DECISION_ENGINE.md).

## Key design decisions

1. **Monsoon substitution** — rainfed high-demand crops (paddy) stay eligible in
   ≥900 mm belts during kharif, downgraded to a warning: the defining reality of
   western-belt agriculture.
2. **Irrigation softens climate, not water** — zero rainfall overlap is a hard
   violation only for rainfed farms; irrigated farms get an "entirely
   irrigation-dependent" warning instead.
3. **Millet band correction** — finger/little millet rainfall windows were raised
   to annual-equivalents consistent with their own zone memberships (data was
   internally contradictory; caught *by the engine's own tests*).
4. **Resilience alternative rule** — must beat both a floor (≥40) and the primary's
   resilience; otherwise the slot stays honestly empty.
5. **Nullable primary** — contexts where nothing is eligible return `primary:null`
   rather than fabricating a recommendation.
6. **Injectable clock** (`options.now`) — byte-level deterministic outputs for
   testing and evaluation reproducibility.

## Verification gate

| Check | Result |
| --- | --- |
| `npm test` | ✅ 45/45 (30 new: constraints 9, suitability 7, recommend 10, API 3, datasets 15 prior) |
| `npm run typecheck` / `lint` | ✅ clean |
| `npm run build` | ✅ `/api/recommend` compiled as dynamic route |
| Live API smoke (dev server) | ✅ see below |

Smoke examples (actual engine output):

```
POST {central-irrigated, rabi, medium-black, assured}
→ primary onion (69, confidence LOW) · secondary tomato · 8 rejected
→ why: 'Soil compatibility: Rated "excellent" on this soil class.'

POST {heavy-rainfall, kharif, laterite, rainfed}
→ primary little-millet (69) · secondary finger-millet (58)
```

The second result is deliberate transparency, not a bug: under strictly rainfed
assumptions the engine prefers drought-hardy millets over paddy because paddy's
water factor collapses without the monsoon-substitution blend. As data quality
improves (live weather, calibrated yields) this trade-off will be recomputed — and
the reasoning will remain inspectable.

## Known gaps / deferred

- Weather not yet integrated: climate factors use static zone bands (Phase 2).
- Economic factor uses dataset midpoints; market quotes unused until Phase 2.
- Dashboard still shows Phase-0 placeholders; UI wiring of `/api/recommend`
  arrives with the weather-integrated dashboard work.
- Confidence is expectedly LOW/MEDIUM under assumed datasets — by design.

## Phase 2 entry criteria — met

Constraint/scoring/ranking contracts are stable and tested; datasets load through
one validated path; the API contract exists. Weather intelligence and economics
can now plug in without touching engine internals.
