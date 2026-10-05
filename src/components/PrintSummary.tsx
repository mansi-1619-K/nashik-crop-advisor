import type {
  CropRecommendation,
  RecommendationRequest,
} from "@/lib/types";
import { REGIONS, SEASONS, SOILS, WATER_LEVELS, formatRupees } from "@/lib/constants";

export function PrintSummary({
  params,
  crops,
  generatedAt,
  source,
}: {
  params: RecommendationRequest;
  crops: CropRecommendation[];
  generatedAt: string;
  source: "ai" | "fallback";
}) {
  // generatedAt is "" during SSR and the initial client render (recommendation
  // arrives via client fetch), so this only formats after data loads — no
  // SSR/client mismatch.
  const generatedLabel = generatedAt
    ? new Date(generatedAt).toLocaleString("en-IN")
    : null;

  return (
    <div className="print-only print-break">
      <div className="mb-6 border-b-2 border-ink pb-4">
        <h1 className="font-display text-2xl font-bold text-ink">
          Nashik Crop Advisor — Advisory Summary Sheet
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {REGIONS[params.region].name} · {SEASONS[params.season].name} ({SEASONS[params.season].window})
          {" · "}
          {SOILS[params.soil].name} · Water: {WATER_LEVELS[params.water].name}
        </p>
        <p className="mt-1 text-xs text-ink-muted">
          {generatedLabel ? `Generated ${generatedLabel} · ` : ""}
          {source === "ai" ? "Gemini AI assisted" : "Scientific fallback dataset"}
        </p>
      </div>

      {crops.map((crop) => {
        const margin =
          crop.financials.grossRevenuePerAcre > 0
            ? Math.round(
                (crop.financials.netProfitPerAcre / crop.financials.grossRevenuePerAcre) * 100,
              )
            : 0;
        return (
          <div key={crop.id} className="mb-5 print-break">
            <h2 className="font-display text-lg font-bold text-ink">
              {crop.crop}
              <span className="ml-2 text-sm font-semibold text-ink-secondary">
                ({crop.tag})
              </span>
            </h2>
            <p className="mt-1 text-sm text-ink">{crop.reason}</p>

            <table className="mt-3 w-full border-collapse text-sm">
              <tbody>
                <tr>
                  <td className="w-1/4 border border-border bg-canvas-warm px-2 py-1 font-semibold text-ink">
                    Sowing window
                  </td>
                  <td className="border border-border px-2 py-1 text-ink">{crop.sowingWindow}</td>
                  <td className="w-1/4 border border-border bg-canvas-warm px-2 py-1 font-semibold text-ink">
                    Duration
                  </td>
                  <td className="border border-border px-2 py-1 text-ink">{crop.duration} days</td>
                </tr>
                <tr>
                  <td className="border border-border bg-canvas-warm px-2 py-1 font-semibold text-ink">
                    Expected yield
                  </td>
                  <td className="border border-border px-2 py-1 text-ink">{crop.expectedYield}</td>
                  <td className="border border-border bg-canvas-warm px-2 py-1 font-semibold text-ink">
                    Companion
                  </td>
                  <td className="border border-border px-2 py-1 text-ink">{crop.companion}</td>
                </tr>
                <tr>
                  <td className="border border-border bg-canvas-warm px-2 py-1 font-semibold text-ink">
                    Input cost / acre
                  </td>
                  <td className="border border-border px-2 py-1 text-ink">
                    {formatRupees(crop.financials.inputCostPerAcre)}
                  </td>
                  <td className="border border-border bg-canvas-warm px-2 py-1 font-semibold text-ink">
                    Gross revenue / acre
                  </td>
                  <td className="border border-border px-2 py-1 text-ink">
                    {formatRupees(crop.financials.grossRevenuePerAcre)}
                  </td>
                </tr>
                <tr>
                  <td className="border border-border bg-canvas-warm px-2 py-1 font-semibold text-ink">
                    Net profit / acre
                  </td>
                  <td className="border border-border px-2 py-1 font-bold text-ink">
                    {formatRupees(crop.financials.netProfitPerAcre)}
                  </td>
                  <td className="border border-border bg-canvas-warm px-2 py-1 font-semibold text-ink">
                    Margin
                  </td>
                  <td className="border border-border px-2 py-1 text-ink">{margin}%</td>
                </tr>
              </tbody>
            </table>

            <h3 className="mt-3 text-sm font-bold text-ink">Key decisions</h3>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink">
              <li>
                <strong>Advisor tip:</strong> {crop.advisorTip}
              </li>
              <li>
                <strong>Water:</strong> {crop.waterRequirement}
              </li>
              <li>
                <strong>Market:</strong> {crop.marketDemand}
              </li>
              <li>
                <strong>Pest & disease risk ({crop.pestAndDiseaseRisk.riskLevel}):</strong>{" "}
                {crop.pestAndDiseaseRisk.primaryPests.join(", ")};{" "}
                {crop.pestAndDiseaseRisk.primaryDiseases.join(", ")}
              </li>
              <li>
                <strong>IPM:</strong> {crop.pestAndDiseaseRisk.ipmAdvice[0]}
              </li>
            </ul>

            <h3 className="mt-3 text-sm font-bold text-ink">Crop calendar</h3>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink">
              {crop.growthTimeline.map((s) => (
                <li key={s.id}>
                  <strong>{s.name}</strong> ({s.days} days, {s.category}) — {s.tasks[0]}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
