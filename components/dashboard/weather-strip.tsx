"use client";

import { Badge } from "@/components/ui/badge";
import type { WeatherBundle } from "@/lib/weather/types";
import type { WeatherSignal } from "@/lib/agriculture/weatherRisk";

export interface WeatherResponse {
  available: boolean;
  freshness: "live" | "cached-fresh" | "cached-stale";
  weather: WeatherBundle;
  signals: WeatherSignal[];
  provenance: {
    dataSource: string;
    sourceClass: string;
    fetchedAt: string;
    forecastWindow: { from: string; to: string } | null;
    note?: string;
  };
}

const severityBar: Record<WeatherSignal["severity"], string> = {
  high: "border-l-2 border-l-alarm",
  moderate: "border-l-2 border-l-caution",
  low: "border-l-2 border-l-ink-soft",
};

const freshnessBadge = (freshness: WeatherResponse["freshness"]) => {
  if (freshness === "live") return <Badge variant="success">LIVE</Badge>;
  if (freshness === "cached-fresh") return <Badge variant="warning">CACHED</Badge>;
  return <Badge variant="danger">STALE CACHE</Badge>;
};

export function WeatherStrip({ data }: { data: WeatherResponse }) {
  const w = data.weather;
  const readouts = [
    { value: `${w.current.temperatureC.toFixed(1)}°`, label: "Temperature °C" },
    { value: `${w.current.humidityPercent}%`, label: "Humidity" },
    { value: `${w.current.windKmh.toFixed(0)}`, label: "Wind km/h" },
  ];

  return (
    <section className="border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-2.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em]">
          Weather — {w.location.talukaName}
        </span>
        <span className="flex items-center gap-2">
          {freshnessBadge(data.freshness)}
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
            upd {new Date(data.provenance.fetchedAt).toLocaleTimeString()}
          </span>
        </span>
      </header>

      <dl className="grid grid-cols-3 divide-x divide-line border-b border-line">
        {readouts.map((r) => (
          <div key={r.label} className="px-4 py-4 md:px-6">
            <dd className="font-display text-2xl font-light leading-none sm:text-3xl md:text-5xl">{r.value}</dd>
            <dt className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.15em] text-ink-soft md:text-[9px]">
              {r.label}
            </dt>
          </div>
        ))}
      </dl>

      <p className="border-b border-line px-5 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
        7-day window {data.provenance.forecastWindow?.from} →{" "}
        {data.provenance.forecastWindow?.to} · {data.provenance.dataSource} ·{" "}
        {data.provenance.sourceClass}
      </p>

      {data.signals.length > 0 && (
        <ul>
          {data.signals.map((s) => (
            <li
              key={s.type + s.validUntil}
              className={`border-b border-line px-5 py-3 last:border-b-0 ${severityBar[s.severity]}`}
            >
              <p className="flex flex-wrap items-center gap-x-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em]">
                {s.type.replace(/-/g, " ")}
                <Badge variant={s.severity === "low" ? "source" : s.severity === "moderate" ? "warning" : "danger"}>
                  heuristic · conf {s.confidence}
                </Badge>
              </p>
              <p className="mt-2 text-sm leading-[1.6]">{s.reason}</p>
              <p className="mt-1.5 font-mono text-[10px] uppercase leading-[1.6] tracking-[0.05em] text-ink-soft">
                → {s.recommendedAction}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
