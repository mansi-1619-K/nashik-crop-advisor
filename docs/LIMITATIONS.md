# Limitations

> Status: living document — expanded every phase.

## Known limitations at project completion (Phase 6)

1. **Assumed agronomy.** Every zone characteristic, crop range and economic
   figure is an unvalidated desk estimate (`quality: assumed`). No recommendation
   should be acted upon without expert validation.
2. **Simplified soil taxonomy** (6 classes, 5 compatibility levels) — real fields
   require soil testing.
3. **Sample market data.** `data/markets/sample-quotes.json` is illustrative only;
   the provider seam exists but no live price source is wired.
4. **Approximate taluka coordinates**, unsuitable for field-level precision.
5. **English-only UI**; Marathi labels exist in data but no localization yet.
6. **High narration latency with the default model**: measured p50 ≈ 20 s /
   p95 ≈ 33 s on `gemini-3.6-flash` (thinking model). Configurable via
   `GEMINI_MODEL`; a faster non-thinking variant would trade depth for speed.
7. **Retrieval is lexical, not semantic** — paraphrases outside the corpus
   vocabulary can miss; measured R@3 = 1.0 applies to the committed label set
   only, and the corpus itself is small (14 documents, English).
8. **Evaluation fixtures are desk judgements** (`quality: assumed`): metrics
   validate engineering consistency and documented behaviour, not field-validated
   agronomy or real farmer outcomes.
9. **Chat history is ephemeral by design** (last 6 turns, no persistence) —
   privacy-first choice, at the cost of continuity across sessions.
10. **No CI pipeline**: tests and evaluation are developer-invoked commands.
11. **Live Gemini behaviour was measured over 5 calls** — enough to validate the
    contract (schema validity, fallback rate, citation honesty), not a statistical
    study of model quality.

## Standing honesty rules

- Never present estimates as measurements or sample data as live.
- Heuristic signals are advisories, never diagnoses.
- The tool supports decisions; it does not guarantee outcomes.
- Metrics that were not measured in a recorded run are marked NOT MEASURED,
  never estimated after the fact.
