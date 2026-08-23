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
  index: string;
  min: number;
  max: number;
  step: number;
  toDisplay: (v: number) => string;
}

const SLIDERS: SliderConfig[] = [
  { key: "rainfallScale", label: "Rainfall", index: "S1", min: 0.5, max: 1.3, step: 0.05, toDisplay: (v) => `${Math.round((v - 1) * 100)}%` },
  { key: "priceFactor", label: "Market price", index: "S2", min: 0.6, max: 1.4, step: 0.05, toDisplay: (v) => `${Math.round((v - 1) * 100)}%` },
  { key: "costFactor", label: "Input costs", index: "S3", min: 0.8, max: 1.6, step: 0.05, toDisplay: (v) => `+${Math.round((v - 1) * 100)}%` },
  { key: "yieldFactor", label: "Expected yield", index: "S4", min: 0.6, max: 1.4, step: 0.05, toDisplay: (v) => `${Math.round((v - 1) * 100)}%` },
];

const WATER_OPTIONS: Array<{ value: WaterAvailability; label: string }> = [
  { value: "rainfed", label: "Rainfed only" },
  { value: "limited", label: "Limited irrigation" },
  { value: "moderate", label: "Moderate irrigation" },
  { value: "assured", label: "Assured irrigation" },
];

function DeltaChip({ value, unit, invert = false }: { value: number | null; unit: string; invert?: boolean }) {
  if (value === null) return <span className="font-mono text-xs text-ink-soft">—</span>;
  const positive = invert ? value < 0 : value > 0;
  const neutral = value === 0;
  const tone = neutral
    ? "bg-white text-ink-soft"
    : positive
      ? "bg-acid text-ink"
      : "bg-alarm text-paper";
  return (
    <span className={`inline-block border border-ink px-1 py-0.5 font-mono text-[11px] font-bold ${tone}`}>
      {value > 0 ? "+" : ""}{value.toLocaleString("en-IN")}{unit}
    </span>
  );
}

const CHART_INK = "#16150f";
const CHART_ACID = "#c7f32e";
const CHART_LINE = "#d9d5c6";

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
        <section className="border-2 border-ink bg-white">
          <header className="flex items-center justify-between gap-2 border-b-2 border-ink bg-paper-dim px-4 py-1.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
              Stress-test presets
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">SIM-01</span>
          </header>

          <div className="border-b border-line p-4 md:p-5">
            <div className="mb-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={CHART_LINE} horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fontFamily: "var(--font-space-mono)", fill: CHART_INK }}
                    stroke={CHART_INK}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 10, fontFamily: "var(--font-space-mono)", fill: CHART_INK }}
                    stroke={CHART_INK}
                  />
                  <Tooltip
                    formatter={(v) => [`${v}/100`, "Top-crop score"]}
                    contentStyle={{
                      borderRadius: 0,
                      border: `2px solid ${CHART_INK}`,
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 11,
                      background: "#fff",
                    }}
                  />
                  <Bar dataKey="score">
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.isBase ? CHART_INK : CHART_ACID} stroke={CHART_INK} strokeWidth={1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="font-mono text-[10px] uppercase leading-relaxed text-ink-soft">
              {report.notes.join(" · ")}
            </p>

            <div className="mt-4 overflow-x-auto border border-ink">
              <table className="w-full min-w-[640px] border-collapse text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b-2 border-ink bg-paper-dim uppercase tracking-wider text-ink-soft">
                    <th className="px-2 py-1.5 font-normal">Scenario</th>
                    <th className="px-2 py-1.5 font-normal">Top crop</th>
                    <th className="px-2 py-1.5 font-normal">Score Δ</th>
                    <th className="px-2 py-1.5 font-normal">Profit Δ ₹/acre</th>
                    <th className="px-2 py-1.5 font-normal">Resilience Δ</th>
                    <th className="px-2 py-1.5 font-normal">Base pick now</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => (
                    <tr key={row.id} className={`border-b border-line last:border-b-0 ${row.id === "base" ? "font-bold" : "text-ink-soft"}`}>
                      <td className="px-2 py-1.5">{row.label}</td>
                      <td className="px-2 py-1.5">{cropName(row.primaryCropId ?? "—")}</td>
                      <td className="px-2 py-1.5"><DeltaChip value={row.deltas.scoreDelta} unit="" /></td>
                      <td className="px-2 py-1.5"><DeltaChip value={row.deltas.profitDeltaInr} unit="" /></td>
                      <td className="px-2 py-1.5"><DeltaChip value={row.deltas.resilienceDelta} unit="" /></td>
                      <td className="px-2 py-1.5">
                        {row.deltas.basePrimaryRank === null ? (
                          <span className="uppercase text-alarm">out of list</span>
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
        </section>
      )}

      <section className="border-2 border-ink bg-white hard-shadow">
        <header className="flex items-center justify-between gap-2 border-b-2 border-ink bg-acid px-4 py-1.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Your what-if scenario
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">SIM-02</span>
        </header>

        <div className="p-4 md:p-5">
          <p className="font-mono text-[10px] uppercase leading-relaxed text-ink-soft">
            Adjust assumptions against the base case. All outputs are engine
            estimates on assumed data.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {SLIDERS.map((s) => (
              <label key={s.key} className="block">
                <span className="flex justify-between font-mono text-[10px] font-bold uppercase tracking-widest">
                  <span>
                    <span className="text-acid-deep">{s.index}</span> {s.label}
                  </span>
                  <span>{s.toDisplay(overrides[s.key])}</span>
                </span>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={overrides[s.key]}
                  onChange={(e) => setOverrides((o) => ({ ...o, [s.key]: Number(e.target.value) }))}
                  className="mt-1.5 w-full"
                />
              </label>
            ))}
            <label className="block">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                Water availability
              </span>
              <select
                value={waterOverride}
                onChange={(e) => setWaterOverride(e.target.value as WaterAvailability)}
                className="mt-1.5 w-full border-[1.5px] border-ink bg-white px-2 py-1.5 text-sm font-medium focus:border-acid-deep focus:outline-none"
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
                className="w-full border-2 border-ink bg-ink px-4 py-2 font-display text-sm uppercase tracking-wide text-paper transition-colors duration-75 hover:bg-acid hover:text-ink disabled:opacity-50"
              >
                {loading ? "Simulating…" : "Run scenario →"}
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-3 border-l-8 border-alarm pl-2 font-mono text-[11px] uppercase text-alarm">
              ERROR // {error}
            </p>
          )}

          {scenario && (
            <div className="mt-5 border-2 border-ink">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink px-3 py-1.5">
                <Badge variant="phase">SCENARIO vs BASE</Badge>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                  Base pick ({cropName(report?.basePrimaryCropId ?? "")}) now ranks{" "}
                  {scenario.deltas.basePrimaryRank === null ? "outside top list" : `#${scenario.deltas.basePrimaryRank}`}
                </span>
              </div>
              <dl className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
                {[
                  ["Top crop", null],
                  ["Score change", null],
                  ["Profit change", null],
                  ["Resilience change", null],
                ].map(([label], idx) => (
                  <div key={idx} className="border-b border-line p-3 sm:border-b-0">
                    <dt className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">{label}</dt>
                    <dd className="mt-1">
                      {idx === 0 && (
                        <>
                          <span className="text-sm font-bold uppercase">{cropName(scenario.primaryCropId ?? "none")}</span>
                          <ScoreBar
                            value={scenario.primaryScore ?? 0}
                            className="mt-2"
                            tone={(scenario.primaryScore ?? 0) >= 70 ? "emerald" : "amber"}
                          />
                        </>
                      )}
                      {idx === 1 && <DeltaChip value={scenario.deltas.scoreDelta} unit=" pts" />}
                      {idx === 2 && <DeltaChip value={scenario.deltas.profitDeltaInr} unit=" ₹/acre" />}
                      {idx === 3 && <DeltaChip value={scenario.deltas.resilienceDelta} unit=" pts" />}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
