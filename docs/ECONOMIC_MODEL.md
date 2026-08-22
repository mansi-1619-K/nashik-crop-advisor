# Economic Model

> Status: skeleton — implemented in Phase 2.

## Purpose

Define the transparent per-acre economic calculation and its honesty labels.

## Planned contents

- Formulas: gross revenue = expected yield × expected price;
  net return = gross − input cost; break-even price = input cost ÷ expected yield; ROI
- Range propagation from crop yield/price ranges
- Market abstraction interface (`lib/market`) and provider roadmap
  (static sample → AGMARKNET/APMC feeds)
- Labelling rules: nothing estimated may render as live

## Current state (Phase 0)

Contracts sketched in `lib/agriculture/results.ts`; sample quotes in
`data/markets/sample-quotes.json` explicitly marked STATIC SAMPLE.
