import { Bug, BookOpenCheck, CalendarRange, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionPlaceholder } from "@/components/dashboard/section-placeholder";
import { Badge, DataSourceBadge } from "@/components/ui/badge";
import { Workspace } from "@/components/dashboard/workspace";

const upcoming = [
  {
    icon: Bug,
    title: "Pest & Disease Risk",
    description:
      "Crop-specific disease risks crossed with live weather favourability — advisory signals only, never diagnoses.",
    phase: "Phase 4",
  },
  {
    icon: CalendarRange,
    title: "Crop Calendar",
    description:
      "Growth-stage timeline for the recommended crop mapped onto the season window and current forecast position.",
    phase: "Later",
  },
  {
    icon: BookOpenCheck,
    title: "Evidence & Citations",
    description:
      "RAG-backed agricultural knowledge (ICAR/university guidance) grounding every AI statement with visible citations.",
    phase: "Phase 5",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Nashik Crop Advisor
            </h1>
            <Badge variant="success">Phase 3 · Explainability + Simulation</Badge>
          </div>
          <p className="text-sm text-zinc-500">
            Hyperlocal AI Decision Support for Climate-Aware Crop Planning — Nashik
            District, Maharashtra
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Decision-support prototype:</strong> recommendations come from a
          deterministic engine over documented assumptions; economics are estimates;
          weather is live from Open-Meteo; every value carries a source label. Not
          agronomic advice.
        </p>

        <Workspace />

        <h2 className="mt-12 mb-4 text-lg font-semibold text-zinc-800">Coming next</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((s) => (
            <Card key={s.title}>
              <SectionPlaceholder icon={s.icon} title={s.title} description={s.description} phase={s.phase} />
            </Card>
          ))}
        </div>

        <h2 className="mt-12 mb-4 text-lg font-semibold text-zinc-800">Data honesty contract</h2>
        <Card className="p-5">
          <p className="mb-3 flex items-center gap-2 text-sm text-zinc-600">
            <ShieldCheck size={16} className="text-emerald-700" aria-hidden />
            Every important value carries exactly one of these source labels:
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
          Nashik Crop Advisor — decision-support prototype built for engineering
          demonstration. Zone definitions and crop parameters are initial documented
          assumptions pending validation against ICAR / Maharashtra agriculture
          references.
        </div>
      </footer>
    </div>
  );
}
