import {
  CloudSun,
  ShieldAlert,
  Sprout,
  GitCompareArrows,
  IndianRupee,
  Droplets,
  Bug,
  CalendarRange,
  BookOpenCheck,
  SlidersHorizontal,
} from "lucide-react";
import { ContextBar } from "@/components/dashboard/context-bar";
import { SectionPlaceholder } from "@/components/dashboard/section-placeholder";
import { Card } from "@/components/ui/card";
import { Badge, DataSourceBadge } from "@/components/ui/badge";

const sections = [
  {
    icon: CloudSun,
    title: "Current Weather",
    description:
      "Live conditions and a 7-day forecast for the selected taluka via Open-Meteo, parsed into agricultural terms. Shows last-updated time and data source.",
    phase: "Phase 2",
  },
  {
    icon: ShieldAlert,
    title: "Agricultural Alerts",
    description:
      "Heuristic advisory signals derived from the forecast: irrigation opportunity, heat stress, fungal-risk windows, spraying suitability. Signals are advisories, never diagnoses.",
    phase: "Phase 2",
  },
  {
    icon: Sprout,
    title: "Top Recommendation",
    description:
      "The highest-scoring eligible crop with suitability score, confidence, expected economics and a transparent 'why' breakdown from the deterministic engine.",
    phase: "Phase 1",
  },
  {
    icon: GitCompareArrows,
    title: "Alternative Crops",
    description:
      "Secondary and climate-resilient alternatives, each ranked lower for explicit, inspectable reasons — including rejected crops with their constraint violations.",
    phase: "Phase 1",
  },
  {
    icon: IndianRupee,
    title: "Economic Analysis",
    description:
      "Input cost, gross revenue, net return, break-even price and ROI per acre — all clearly labelled as estimates until real market data is integrated.",
    phase: "Phase 2",
  },
  {
    icon: Droplets,
    title: "Water Demand",
    description:
      "Crop water demand versus your declared availability, with drought-tolerance context for water-constrained belts.",
    phase: "Phase 2",
  },
  {
    icon: Bug,
    title: "Pest & Disease Risk",
    description:
      "Known disease risks per crop with weather-favourable conditions highlighted as risk signals, not confirmed infections.",
    phase: "Phase 4",
  },
  {
    icon: CalendarRange,
    title: "Crop Calendar",
    description:
      "Growth-stage timeline for the recommended crop mapped to the season window and current weather position.",
    phase: "Phase 3",
  },
  {
    icon: BookOpenCheck,
    title: "Evidence",
    description:
      "Retrieved agricultural knowledge (ICAR/university guidance) with citations backing important AI statements. Ungrounded claims will be flagged as uncertain.",
    phase: "Phase 5",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Nashik Crop Advisor
            </h1>
            <Badge variant="phase">Phase 0 · Foundation</Badge>
          </div>
          <p className="text-sm text-zinc-500">
            Hyperlocal AI Decision Support for Climate-Aware Crop Planning — Nashik
            District, Maharashtra
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Prototype notice:</strong> This is an early foundation build. No
          recommendations, prices or forecasts are computed yet; every card below shows
          which upcoming phase will fill it. The system will always label values by
          source class.
        </p>

        <ContextBar />

        <h2 className="mt-10 mb-4 text-lg font-semibold text-zinc-800">
          Dashboard modules
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Card key={s.title}>
              <SectionPlaceholder
                icon={s.icon}
                title={s.title}
                description={s.description}
                phase={s.phase}
              />
            </Card>
          ))}
          <Card className="sm:col-span-2 lg:col-span-1 border-emerald-200 bg-emerald-50/40">
            <SectionPlaceholder
              icon={SlidersHorizontal}
              title="What-If Farm Simulator"
              description="Adjust rainfall, water, price, input cost and yield assumptions to see BASE vs SCENARIO changes in score, profit, risk and ranking."
              phase="Phase 3"
            />
          </Card>
        </div>

        <h2 className="mt-12 mb-4 text-lg font-semibold text-zinc-800">
          Data honesty contract
        </h2>
        <Card className="p-5">
          <p className="mb-3 text-sm text-zinc-600">
            Every important value shown by this tool carries exactly one of these source
            labels:
          </p>
          <div className="flex flex-wrap gap-2">
            <DataSourceBadge valueClass="live" />
            <DataSourceBadge valueClass="static" />
            <DataSourceBadge valueClass="estimated" />
            <DataSourceBadge valueClass="heuristic" />
            <DataSourceBadge valueClass="ai_generated" />
            <DataSourceBadge valueClass="user_provided" />
          </div>
        </Card>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs leading-relaxed text-zinc-500">
          Decision-support prototype. Not agronomic advice. Zone definitions and crop
          parameters are initial documented assumptions pending validation against ICAR /
          Maharashtra agriculture references.
        </div>
      </footer>
    </div>
  );
}
