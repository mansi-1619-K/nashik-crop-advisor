"use client";

import { useState } from "react";
import { MapPin, CalendarDays, Layers, Droplets, Info } from "lucide-react";
import { ZONE_IDS } from "@/lib/agriculture/zone";
import { SOIL_IDS } from "@/lib/agriculture/soil";
import { SEASON_IDS } from "@/lib/agriculture/season";
import { WATER_AVAILABILITY_LEVELS } from "@/lib/agriculture/context";

const zoneLabels: Record<(typeof ZONE_IDS)[number], string> = {
  "heavy-rainfall": "Heavy Rainfall Belt (West)",
  "central-irrigated": "Central / Irrigated Belt",
  "arid-eastern": "Arid / Eastern Belt",
};

const seasonLabels: Record<(typeof SEASON_IDS)[number], string> = {
  kharif: "Kharif (Monsoon)",
  rabi: "Rabi (Post-Monsoon)",
  summer: "Summer",
  perennial: "Perennial / Orchard Cycle",
};

const soilLabels: Record<(typeof SOIL_IDS)[number], string> = {
  "deep-black": "Deep Black (Regur)",
  "medium-black": "Medium Black",
  "shallow-black": "Shallow Black",
  "alluvial-loam": "Alluvial Loam",
  laterite: "Laterite / Hill Soil",
  "sandy-loam": "Sandy Loam",
};

const waterLabels: Record<(typeof WATER_AVAILABILITY_LEVELS)[number], string> = {
  rainfed: "Rainfed only",
  limited: "Limited irrigation",
  moderate: "Moderate irrigation",
  assured: "Assured irrigation",
};

function Select({
  icon: Icon,
  label,
  labels,
  ids,
  value,
  onChange,
}: {
  icon: typeof MapPin;
  label: string;
  labels: Record<string, string>;
  ids: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
        <Icon size={13} aria-hidden />
        {label}
      </span>
      <select
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {ids.map((id) => (
          <option key={id} value={id}>
            {labels[id] ?? id}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ContextBar() {
  const [zoneId, setZoneId] = useState<string>(ZONE_IDS[0]);
  const [seasonId, setSeasonId] = useState<string>(SEASON_IDS[0]);
  const [soilId, setSoilId] = useState<string>(SOIL_IDS[0]);
  const [waterAvailability, setWaterAvailability] = useState<string>(
    WATER_AVAILABILITY_LEVELS[0],
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          icon={MapPin}
          label="Zone"
          ids={ZONE_IDS}
          labels={zoneLabels}
          value={zoneId}
          onChange={setZoneId}
        />
        <Select
          icon={CalendarDays}
          label="Season"
          ids={SEASON_IDS}
          labels={seasonLabels}
          value={seasonId}
          onChange={setSeasonId}
        />
        <Select
          icon={Layers}
          label="Soil"
          ids={SOIL_IDS}
          labels={soilLabels}
          value={soilId}
          onChange={setSoilId}
        />
        <Select
          icon={Droplets}
          label="Water"
          ids={WATER_AVAILABILITY_LEVELS}
          labels={waterLabels}
          value={waterAvailability}
          onChange={setWaterAvailability}
        />
      </div>
      <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
        <Info size={13} aria-hidden />
        Selections are captured locally for now — the deterministic recommendation engine activates in Phase&nbsp;1.
      </p>
    </div>
  );
}
