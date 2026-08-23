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
6. **Narration latency is thinking-mode dependent.** Default `GEMINI_THINKING=low`
   measures p50 ≈ 1.5–1.8 s; `GEMINI_THINKING=high` measures p50 ≈ 19.9 s /
   p95 ≈ 33.5 s with deeper phrasing. Both modes are first-attempt schema-valid
   in probe runs.
7. **Retrieval is lexical, not semantic** — BM25 scoring with phrase-adjacency
   bonuses over a 25-document corpus; paraphrase gaps outside the corpus
   vocabulary can still miss. Measured R@3 = 1.0 / MRR = 1.0 applies to the
   committed label set only.
8. **Evaluation fixtures are desk judgements** (`quality: assumed`): metrics
   validate engineering consistency and documented behaviour, not field-validated
   agronomy or real farmer outcomes.
9. **Chat history is ephemeral by default** (last 6 turns per request). Opt-in
   transcript persistence stores only on the farmer's own device (localStorage),
   never server-side.
10. **Live Gemini behaviour was measured over small samples** — enough to
    validate the contract (schema validity, fallback rate, citation honesty),
    not a statistical study of model quality. `EVAL_AI_REPEATS` allows larger
    runs, bounded by free-tier daily quota, which caps how many live calls a
    day the evaluation harness itself can make.
11. **No automated CI for live-AI metrics**: CI runs lint/typecheck/tests/build/
    deterministic evaluation on every push; live-AI measurement stays manual by
    design (quota + nondeterminism).

## Standing honesty rules

- Never present estimates as measurements or sample data as live.
- Heuristic signals are advisories, never diagnoses.
- The tool supports decisions; it does not guarantee outcomes.
- Metrics that were not measured in a recorded run are marked NOT MEASURED,
  never estimated after the fact.
