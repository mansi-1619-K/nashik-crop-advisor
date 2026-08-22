"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/bar";
import type { SensitivityReport, SensitivityRow } from "@/lib/agriculture/sensitivity";
import type { WaterAvailability } from "@/lib/agriculture/context";
import { cropName } from "@/components/dashboard/recommendation-card";

export interface SimulatorContext {
  zoneId: string;
  seasonId: string;
  soilId: string;
  waterAvailability: WaterAvailability;
}

interface SliderConfig {
  key: "rainfallScale" | "priceFactor" | "costFactor" | "yieldFactor";
  label: string;
  min: number;
  max: number;
  step: number;
  toDisplay: (v: number) => string;
}

const SLIDERS: SliderConfig[] = [
  { key: "rainfallScale", label: "Rainfall", min: 0.5, max: 1.3, step: 0.05, toDisplay: (v) => `${Math.round((v - 1) * 100)}%` },
  { key: "priceFactor", label: "Market price", min: 0.6, max: 1.4, step: 0.05, toDisplay: (v) => `${Math.round((v - 1) * 100)}%` },
  { key: "costFactor", label: "Input costs", min: 0.8, max: 1.6, step: 0.05, toDisplay: (v) => `+${Math.round((v - 1) * 100)}%` },
  { key: "yieldFactor", label: "Expected yield", min: 0.6, max: 1.4, step: 0.05, toDisplay: (v) => `${Math.round((v - 1) * 100)}%` },
];

const WATER_OPTIONS: Array<{ value: WaterAvailability; label: string }> = [
  { value: "rainfed", label: "Rainfed only" },
  { value: "limited", label: "Limited irrigation" },
  { value: "moderate", label: "Moderate irrigation" },
  { value: "assured", label: "Assured irrigation" },
];

function DeltaChip({ value, unit, invert = false }: { value: number | null; unit: string; invert?: boolean }) {
  if (value === null) return <span className="text-xs text-zinc-400">—</span>;
  const positive = invert ? value < 0 : value > 0;
  const neutral = value === 0;
  const tone = neutral
    ? "bg-zinc-100 text-zinc-600"
    : positive
      ? "bg-emerald-100 text-emerald-800"
      : "bg-red-100 text-red-700";
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${tone}`}>
      {value > 0 ? "+" : ""}{value.toLocaleString("en-IN")}{unit}
    </span>
  );
}

export function WhatIfSimulator({
  context,
  report,
}: {
  context: SimulatorContext;
  report: SensitivityReport | null;
}) {
  const [overrides, setOverrides] = useState<Record<string, number>>({
    rainfallScale: 1,
    priceFactor: 1,
    costFactor: 1,
    yieldFactor: 1,
  });
  const [waterOverride, setWaterOverride] = useState<WaterAvailability>(context.waterAvailability);
  const [scenario, setScenario] = useState<SensitivityRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartData = useMemo(
    () =>
      (report?.rows ?? [])
        .filter((r) => r.primaryScore !== null)
        .map((r) => ({
          name: r.label.replace(" / Orchard Cycle", ""),
          score: r.primaryScore ?? 0,
          isBase: r.id === "base",
        })),
    [report],
  );

  async function runCustomScenario() {
    setLoading(true);
    setError(null);
    try {
      const cleanOverrides = Object.fromEntries(
        Object.entries(overrides).filter(([, v]) => v !== 1),
      ) as Record<string, number>;
      const payloadScenarios = [
        { id: "base", label: "Base case", overrides: {} },
        {
          id: "custom",
          label: "Your scenario",
          overrides:
            waterOverride !== context.waterAvailability
              ? { ...cleanOverrides, waterOverride }
              : cleanOverrides,
        },
      ];
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context, scenarios: payloadScenarios }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Simulation failed");
      const json = (await res.json()) as SensitivityReport;
      setScenario(json.rows.find((r) => r.id === "custom") ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {report && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-zinc-900">Stress-test presets</h3>
          <div className="mb-5 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}/100`, "Top-crop score"]} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.isBase ? "#059669" : "#a7f3d0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-zinc-500">{report.notes.join(" · ")}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="text-zinc-500">
                <tr>
                  <th className="py-1.5 pr-3 font-medium">Scenario</th>
                  <th className="py-1.5 pr-3 font-medium">Top crop</th>
                  <th className="py-1.5 pr-3 font-medium">Score Δ</th>
                  <th className="py-1.5 pr-3 font-medium">Profit Δ (₹/acre)</th>
                  <th className="py-1.5 pr-3 font-medium">Resilience Δ</th>
                  <th className="py-1.5 font-medium">Base pick now ranks</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.id} className={row.id === "base" ? "font-medium text-zinc-900" : "text-zinc-600"}>
                    <td className="py-1.5 pr-3">{row.label}</td>
                    <td className="py-1.5 pr-3">{cropName(row.primaryCropId ?? "—")}</td>
                    <td className="py-1.5 pr-3"><DeltaChip value={row.deltas.scoreDelta} unit="" /></td>
                    <td className="py-1.5 pr-3"><DeltaChip value={row.deltas.profitDeltaInr} unit="" /></td>
                    <td className="py-1.5 pr-3"><DeltaChip value={row.deltas.resilienceDelta} unit="" /></td>
                    <td className="py-1.5">
                      {row.deltas.basePrimaryRank === null ? (
                        <span className="text-red-600">out of list</span>
                      ) : (
                        `#${row.deltas.basePrimaryRank}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-zinc-900">
          <SlidersHorizontal size={18} className="text-emerald-700" aria-hidden />
          Your what-if scenario
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Adjust assumptions against the base case. All outputs are engine estimates on assumed data.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SLIDERS.map((s) => (
            <label key={s.key} className="block">
              <span className="flex justify-between text-xs font-medium text-zinc-600">
                {s.label}
                <span className="font-mono text-emerald-700">{s.toDisplay(overrides[s.key])}</span>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={overrides[s.key]}
                onChange={(e) => setOverrides((o) => ({ ...o, [s.key]: Number(e.target.value) }))}
                className="mt-1 w-full accent-emerald-600"
              />
            </label>
          ))}
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Water availability</span>
            <select
              value={waterOverride}
              onChange={(e) => setWaterOverride(e.target.value as WaterAvailability)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            >
              {WATER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              onClick={runCustomScenario}
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Simulating…" : "Run scenario"}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {scenario && (
          <div className="mt-5 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Badge variant="phase">SCENARIO vs BASE</Badge>
              <span className="text-xs text-zinc-500">
                Base pick ({cropName(report?.basePrimaryCropId ?? "")}) now ranks{" "}
                {scenario.deltas.basePrimaryRank === null ? "outside top list" : `#${scenario.deltas.basePrimaryRank}`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-[11px] uppercase text-zinc-400">Top crop</p>
                <p className="mt-0.5 text-sm font-semibold">{cropName(scenario.primaryCropId ?? "none")}</p>
                <ScoreBar value={scenario.primaryScore ?? 0} className="mt-2" tone={(scenario.primaryScore ?? 0) >= 70 ? "emerald" : "amber"} />
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-[11px] uppercase text-zinc-400">Score change</p>
                <p className="mt-1"><DeltaChip value={scenario.deltas.scoreDelta} unit=" pts" /></p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-[11px] uppercase text-zinc-400">Profit change</p>
                <p className="mt-1"><DeltaChip value={scenario.deltas.profitDeltaInr} unit=" ₹/acre" /></p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-[11px] uppercase text-zinc-400">Resilience change</p>
                <p className="mt-1"><DeltaChip value={scenario.deltas.resilienceDelta} unit=" pts" /></p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
