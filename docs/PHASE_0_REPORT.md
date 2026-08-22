# PHASE 0 REPORT — Project Foundation

**Date:** 2026-08-22 · **Status:** ✅ Complete · **All gates passed**

## Objective

Initialize Nashik Crop Advisor from scratch per the build brief: project scaffold,
folder architecture, documentation skeleton, initial TypeScript domain models,
agricultural dataset structure, testing setup, and a basic dashboard shell — then
stop before any engine work.

## Environment

| Component | Version |
| --- | --- |
| Node | 26.7.0 |
| npm | 12.0.2 |
| Next.js | 16.3.2 (App Router, Turbopack) |
| React / React DOM | 19.2.8 |
| TypeScript | 5.x (strict via scaffold config) |
| Tailwind CSS | v4 (`@tailwindcss/postcss`) |
| zod | 4.4.3 |
| lucide-react | 1.33.0 |
| recharts | 3.10.1 |
| framer-motion | 13.1.1 |
| vitest / @testing-library | 4.1.11 / 16.3.2 |

## What was built

### 1. Scaffold & architecture
- create-next-app (TS + Tailwind + ESLint + App Router), scaffolded under a
  lowercase temp name and moved into `Nashik-crop-advisor/` (npm naming rules).
- Full folder skeleton: `lib/{agriculture,ai,rag,weather,market,utils}`,
  `components/{dashboard,weather,recommendations,analytics,simulator,ui}`,
  `data/{crops,zones,soils,markets,scenarios}`, `evaluation/{scenarios,benchmarks,scripts}`,
  `tests/{agriculture,api,ai,integration}`, `docs/`.

### 2. Domain models + validation contracts
- `lib/types/common.ts` — cross-cutting primitives: `Range`, `DataSourceClass`
  (`live|static|estimated|heuristic|ai_generated|user_provided`), `Severity`,
  `ConfidenceLevel`, `SourceRef`, `DatasetMeta`, dataset envelope helper.
- `lib/agriculture/zone.ts` — 3 macro-zones, talukas with coordinates +
  precision flag.
- `lib/agriculture/soil.ts` — 6-class practical soil taxonomy.
- `lib/agriculture/season.ts` — kharif/rabi/summer/perennial with month windows.
- `lib/agriculture/crop.ts` — full crop model (water demand, tolerances,
  climate/rainfall/duration ranges, growth stages, disease risks, economics block,
  mandatory honesty notes).
- `lib/agriculture/context.ts` — farmer context (core + advanced inputs) and
  preset scenarios.
- `lib/agriculture/results.ts` — engine output contracts: constraint results,
  factor scores, confidence assessments, recommendation shapes (no logic yet).
- `lib/market/types.ts` — market quote schema with explicit `valueClass`.
- Every dataset has a colocated Zod schema; loaders validate on read
  (`lib/utils/datasetLoader.ts`) with typed load/validation errors.

### 3. Datasets with provenance (`data/`)
| File | Quality | Notes |
| --- | --- | --- |
| `zones/nashik-zones.json` | assumed | 3 belts, 13 talukas, approximate coords flagged |
| `soils/nashik-soils.json` | assumed | 6 classes incl. Marathi local names |
| `seasons/maharashtra-seasons.json` | assumed | month windows per season |
| `crops/nashik-crops.json` | assumed | 11 crops; **all** economics `dataQuality: "assumed"` |
| `markets/sample-quotes.json` | sample | explicitly "NOT live market prices" |
| `scenarios/presets.json` | sample | the 5 predefined scenarios from the brief |

Each file carries `meta` with version, date, quality class, disclaimer and sources.

### 4. Testing
Vitest 4 (jsdom) with tsconfig path resolution. `tests/agriculture/datasets.test.ts`:
15 tests covering schema validation of all six datasets, uniqueness invariants,
cross-dataset integrity (crop→zone/season/soil references, preset taluka→zone),
price sanity bounds, non-live labelling, and loader error behaviour.

### 5. Dashboard shell
- Header (title/subtitle + phase badge), prototype notice banner.
- Context bar (zone/season/soil/water selects) wired to local state only —
  honestly labelled as inactive until Phase 1.
- All §28 dashboard modules present as cards with per-phase availability badges;
  zero fabricated data anywhere.
- Data-honesty legend rendering all six source classes.
- UI primitives: `Card`, `Badge`, `DataSourceBadge`, section placeholders.

### 6. Config & docs
`.env.example` (server-only key note), README with quickstart + phase status,
10 docs skeletons, this report. Git initialized; baseline commit made.

## Decisions & deviations

1. **`lib/types/common.ts`** added outside the suggested structure for shared
   primitives (provenance/severity/confidence) — they are consumed by agriculture,
   weather and market layers alike; keeping them domain-neutral avoids cycles.
2. **`soilCompatibility` modelled as an array of `{soilId, level}` entries**
   instead of a partial record — simpler JSON authoring and unambiguous Zod
   validation (unique-key refinement included).
3. **Presets typed `quality: "sample"`** rather than "curated" — they are
   predefined demonstrations, not validated configurations.
4. **Light theme only** for Phase 0 (serious tool aesthetic); dark mode deferred.
5. **Playwright deferred** to Phase 6/7 per agreement; Vitest covers Phase 0 needs.
6. Package renamed from scaffold default to `nashik-crop-advisor`; `"type": "module"`
   added to satisfy Vitest 4 config loading cleanly.
7. Next 16 specifics honored (per bundled `node_modules/next/dist/docs`):
   typegen-provided `LayoutProps<"/">`, Turbopack build pipeline.

## Verification gate (all passed)

| Check | Result |
| --- | --- |
| `npm run typecheck` (tsc --noEmit) | ✅ clean |
| `npm run lint` (ESLint 9 flat) | ✅ clean |
| `npm test` (Vitest) | ✅ 15/15 |
| `npm run build` (next build) | ✅ static prerender OK |
| Dev server SSR smoke test | ✅ title + all sections render |
| Git baseline commit | ✅ `main` |

## Known gaps / deferred

- No engines yet (constraints/scoring/weather/economics/Gemini/RAG) — by design.
- All agronomic values are unvalidated assumptions pending Phase 1 research pass
  against ICAR/Maharashtra sources.
- Taluka coordinates approximate; fine for district weather lookups only.
- Context selections don't yet drive anything (Phase 1 wires the engine).

## How to run

```bash
npm install && npm run dev    # http://localhost:3000
npm test                      # data-contract suite
```

## Phase 1 entry criteria — met

Domain contracts compile, datasets validate against those contracts, the app runs,
and the honesty framework (source classes + provenance metadata) is enforced at the
schema level. Ready to build the deterministic agricultural engine.
