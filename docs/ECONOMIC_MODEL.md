# Economic Model

> Status: **implemented (Phase 2)** · Market data: static sample provider

## Purpose

Transparent per-acre economics with honest source labels — never disguising
estimates as measurements.

## Formulas (per acre, INR)

```
Gross Revenue      = Expected Yield × Expected Price
Net Return         = Gross Revenue − Input Cost
Break-even Price   = Input Cost ÷ Expected Yield
ROI %              = Net Return ÷ Input Cost × 100
```

Range view (`estimateEconomicsFromCrop`): min/max propagation of dataset ranges
(e.g. gross.min = yield.min × price.min). Point view (`computeEconomics`):
midpoints or overrides.

## Source priority for each input (`lib/agriculture/economics.ts`)

| Input | Priority chain |
| --- | --- |
| Yield | farmer override (`user_provided`) → dataset midpoint (`estimated`) |
| Price | farmer override (`user_provided`) → market quote modal (`live`/`static` by provider class) → dataset midpoint (`estimated`) |
| Input cost | dataset midpoint (`estimated`) |

Every number in the output carries `{value, sourceClass, basis}` so the UI can
render exact provenance badges. Totals scale by `areaAcres` when provided.

## Market abstraction (`lib/market/provider.ts`)

```ts
interface MarketProvider {
  kind: "static-sample" | "live";
  label: string;
  getQuote(cropId: string): Promise<MarketQuote | null>;
}
```

- `StaticSampleMarketProvider` — reads `data/markets/sample-quotes.json`
  (explicitly labelled STATIC SAMPLE; never presented as live).
- `setMarketProvider()` allows future AGMARKNET/APMC/other integrations without
  touching engine code.

## Honesty rules

- Sample quotes are labelled "not a live observation" inside their basis strings.
- All economics remain `estimated` until a genuinely live provider exists.
- No guarantee of yield, price, or profit is ever implied; break-even is always
  shown alongside optimistic figures.
