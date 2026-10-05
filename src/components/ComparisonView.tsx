"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GitCompareArrows } from "lucide-react";
import type { CropRecommendation } from "@/lib/types";
import { formatRupees } from "@/lib/constants";
import { SectionCard, SectionTitle, Badge } from "./ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

/* Series colors — deepened moss/terracotta/olive: recharts renders legend
   text in the series color, so these must clear 4.5:1 on the white card
   (they also serve as radar strokes and badge dots). */
const COLORS = ["#35602a", "#a4552d", "#5d6b34"];

const METRIC_KEYS: {
  key: keyof CropRecommendation["radarMetrics"];
  label: string;
}[] = [
  { key: "yieldPotential", label: "Yield" },
  { key: "marketValue", label: "Market" },
  { key: "waterEfficiency", label: "Water" },
  { key: "soilCompatibility", label: "Soil" },
  { key: "climateResilience", label: "Climate" },
];

export function ComparisonView({
  crops,
  open,
  onClose,
}: {
  crops: CropRecommendation[];
  open: boolean;
  onClose: () => void;
}) {
  const financialData = crops.map((c) => ({
    name: c.crop.split(" (")[0],
    Input: c.financials.inputCostPerAcre,
    Revenue: c.financials.grossRevenuePerAcre,
    "Net Profit": c.financials.netProfitPerAcre,
  }));

  const radarData = METRIC_KEYS.map((m) => {
    const entry: Record<string, string | number> = { subject: m.label };
    crops.forEach((c) => {
      entry[c.crop.split(" (")[0]] = c.radarMetrics[m.key];
    });
    return entry;
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      {/* Solid dialog shell (Phase 7): liquid glass was removed from the
          modal — DialogContent supplies the paper surface, border, shadow
          and close button; this component only sizes it wider. */}
      <DialogContent
        className="bg-surface shadow-3 sm:max-w-5xl"
        overlayClassName="bg-ink/30 backdrop-blur-sm"
      >
        <DialogHeader className="gap-1 pr-10 text-left">
          {/* Single hierarchy: display heading → muted subhead (icon inline). */}
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-ink">
            <span className="text-moss" aria-hidden>
              <GitCompareArrows className="h-5 w-5" />
            </span>
            Comparative Analysis
          </DialogTitle>
          <DialogDescription className="text-sm text-ink-muted">
            All recommended crops side by side — financials and suitability.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          {crops.map((c, i) => (
            <Badge
              key={c.id}
              tone={i === 0 ? "moss" : i === 1 ? "harvest" : "sage"}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: COLORS[i] }}
              />
              {c.crop}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard className="p-5">
            <SectionTitle
              title="Financial ROI (per acre)"
              subtitle="Input cost, gross revenue and net profit (₹)"
            />
            <div className="mt-3 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={financialData}
                  margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                  barSize={14}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5decf"
                    strokeOpacity={0.9}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 11,
                      fill: "#55514a",
                      fontFamily: "var(--font-inter)",
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6e6a62" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 100000
                        ? `${(v / 100000).toFixed(1)}L`
                        : `${Math.round(v / 1000)}k`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5decf",
                      fontSize: 12,
                      background: "#ffffff",
                      fontFamily: "var(--font-inter)",
                      color: "#1f1d1a",
                    }}
                    formatter={(value) => formatRupees(Number(value))}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 12,
                      fontFamily: "var(--font-inter)",
                    }}
                    formatter={(value) => (
                      <span style={{ color: "#55514a" }}>{value}</span>
                    )}
                  />
                  <Bar dataKey="Input" fill="#8a8078" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Revenue" fill="#7c8a3d" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="Net Profit"
                    fill="#35602a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard className="p-5">
            <SectionTitle
              title="Suitability Radar Overlay"
              subtitle="5-axis metric comparison (0–100)"
            />
            <div className="mt-3 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={radarData}
                  cx="50%"
                  cy="50%"
                  outerRadius="70%"
                >
                  <PolarGrid stroke="#e5decf" strokeOpacity={0.9} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fontSize: 11,
                      fill: "#55514a",
                      fontFamily: "var(--font-inter)",
                    }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#55514a" }}
                    tickCount={5}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5decf",
                      fontSize: 12,
                      background: "#ffffff",
                      fontFamily: "var(--font-inter)",
                      color: "#1f1d1a",
                    }}
                    formatter={(value, name) => [`${value} / 100`, name]}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 12,
                      fontFamily: "var(--font-inter)",
                    }}
                  />
                  {crops.map((c, i) => (
                    <Radar
                      key={c.id}
                      name={c.crop.split(" (")[0]}
                      dataKey={c.crop.split(" (")[0]}
                      stroke={COLORS[i]}
                      fill={COLORS[i]}
                      fillOpacity={0.08}
                      strokeWidth={2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}
