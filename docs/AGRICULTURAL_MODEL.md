# Agricultural Model

> Status: **implemented (Phase 1, refined through Phase 6)**

## Purpose

Document the agricultural knowledge base: zones, seasons, soils, crops — including
the source and quality of every important assumption.

## Datasets (all under `data/`, Zod-validated at load)

| Dataset | File | Content | Quality |
| --- | --- | --- | --- |
| Zones | `zones/nashik-zones.json` | 3 agro-climatic belts: `heavy-rainfall` (western ghats belt), `central-irrigated`, `arid-eastern`; each with rainfall band, irrigation access, taluka mapping | assumed |
| Soils | `soils/nashik-soils.json` | 6-class taxonomy: deep/medium/shallow black, alluvial loam, laterite, sandy loam | assumed |
| Seasons | `seasons/maharashtra-seasons.json` | kharif / rabi / summer / perennial windows for Maharashtra | assumed |
| Crops | `crops/nashik-crops.json` | 11 crops with full parameter dictionaries (below) | assumed |
| Markets | `markets/sample-quotes.json` | illustrative price samples via the provider seam | sample |
| Knowledge corpus | `knowledge/nashik-agri-handbook.json` | 14 retrieval documents for RAG grounding | assumed (`internal` credibility) |

Every file carries a `meta` block: id, version, ISO date, quality class,
disclaimer, and source references. **All agronomic and economic values are
initial estimates pending validation against ICAR guides and MPKV packages of
practice** — the disclaimers say so explicitly.

## Crop parameter dictionary

| Field | Semantics |
| --- | --- |
| `zones` / `seasons` | hard membership constraints; exclusion = rejection |
| `soilCompatibility[]` | per-soil level: excellent → unsuitable; only `unsuitable` is a hard violation |
| `waterDemand` | low / medium / high → required water-availability tier 0/1/2 |
| `droughtTolerance`, `floodTolerance` | 0–100 scales feeding resilience scoring |
| `temperatureRangeC`, `rainfallRangeMm` | climate fit; zero rainfall-band overlap is hard under rainfed, warning otherwise |
| `growthDurationDays`, `growthStages[]` | duration + stage calendar for advisory phrasing |
| `diseaseRisks[]` | name + favoured conditions + typical severity (never diagnostic) |
| `economics{}` | input cost, yield, price ranges + `dataQuality` label |

## Engine rules that consume them

1. **Hard constraints** (`lib/agriculture/constraints.ts`): zone, season, water
   tier, unsuitable soil, rainfed climate overlap. One violation = rejected.
2. **Monsoon substitution**: rainfed + kharif + zone rainfall ≥ 900 mm converts
   the water violation into an explicit "depends on timely rains" warning.
3. **Suitability score**: 7 weighted factors − risk penalty (0.25 scale), each
   factor carrying a generated human-readable reason.
4. **Ranking roles**: primary / secondary / resilient-alternative (resilience
   tie-break among the remainder), plus why-ranked-lower explanations.
5. **Confidence**: deduction-based from dataset quality, warnings count,
   top-score margin and live-weather availability.

## Provenance policy

`assumed → curated`: upgrade path requires replacing dataset values with
cited ICAR/university figures and flipping `meta.quality`. The RAG corpus
mirrors this with credibility tiers (`internal → icar/university/government`),
so institutional sources outrank editorial summaries as they are added.

## Known gaps requiring expert validation

- All yield/price/cost ranges are desk estimates.
- Zone rainfall bands are coarse belt-level approximations.
- Soil taxonomy collapses intra-soil variation (pH, salinity, depth).
- Disease "favoured conditions" are qualitative heuristics, not thresholds.

Measured behaviour of everything above: [EVALUATION.md](EVALUATION.md).
