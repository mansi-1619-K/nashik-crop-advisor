"use client";

import { CloudSun, Droplets, Thermometer, Wind, AlertTriangle, ShieldCheck } from "lucide-react";
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

const severityStyles: Record<WeatherSignal["severity"], string> = {
  high: "border-red-200 bg-red-50 text-red-800",
  moderate: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-sky-200 bg-sky-50 text-sky-800",
};

const freshnessBadge = (freshness: WeatherResponse["freshness"]) => {
  if (freshness === "live") return <Badge variant="success">LIVE</Badge>;
  if (freshness === "cached-fresh") return <Badge variant="warning">CACHED</Badge>;
  return <Badge variant="danger">STALE CACHE</Badge>;
};

export function WeatherStrip({ data }: { data: WeatherResponse }) {
  const w = data.weather;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-zinc-900">
          <CloudSun size={18} className="text-emerald-700" aria-hidden />
          Current Weather — {w.location.talukaName}
        </h3>
        <div className="flex items-center gap-2">
          {freshnessBadge(data.freshness)}
          <span className="text-xs text-zinc-400">
            updated {new Date(data.provenance.fetchedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-2 rounded-lg bg-zinc-50 p-3">
          <Thermometer size={16} className="text-zinc-500" aria-hidden />
          <div>
            <p className="text-lg font-semibold leading-none">{w.current.temperatureC.toFixed(1)}°C</p>
            <p className="text-xs text-zinc-500">temperature</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-zinc-50 p-3">
          <Droplets size={16} className="text-zinc-500" aria-hidden />
          <div>
            <p className="text-lg font-semibold leading-none">{w.current.humidityPercent}%</p>
            <p className="text-xs text-zinc-500">humidity</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-zinc-50 p-3">
          <Wind size={16} className="text-zinc-500" aria-hidden />
          <div>
            <p className="text-lg font-semibold leading-none">{w.current.windKmh.toFixed(0)} km/h</p>
            <p className="text-xs text-zinc-500">wind</p>
          </div>
        </div>
        <div className="flex flex-col justify-center rounded-lg bg-zinc-50 px-3 py-2">
          <p className="text-xs font-medium text-zinc-700">
            7-day: {data.provenance.forecastWindow?.from} → {data.provenance.forecastWindow?.to}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            {data.provenance.dataSource} · {data.provenance.sourceClass}
          </p>
        </div>
      </div>

      {data.signals.length > 0 && (
        <ul className="mt-4 space-y-2">
          {data.signals.map((s) => (
            <li key={s.type + s.validUntil} className={`rounded-lg border p-3 ${severityStyles[s.severity]}`}>
              <p className="text-sm font-medium">
                {s.severity === "low" ? (
                  <ShieldCheck size={14} className="mr-1 inline" aria-hidden />
                ) : (
                  <AlertTriangle size={14} className="mr-1 inline" aria-hidden />
                )}
                {s.type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                <span className="ml-2 rounded bg-white/70 px-1.5 py-0.5 text-[10px] uppercase">
                  heuristic · confidence {s.confidence}
                </span>
              </p>
              <p className="mt-1 text-sm">{s.reason}</p>
              <p className="mt-1 text-xs opacity-80">{s.recommendedAction}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
