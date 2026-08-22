"use client";

import { CalendarDays, Layers, MapPin, Droplets } from "lucide-react";
import { ZONE_IDS } from "@/lib/agriculture/zone";
import { SOIL_IDS } from "@/lib/agriculture/soil";
import { SEASON_IDS } from "@/lib/agriculture/season";
import {
  WATER_AVAILABILITY_LEVELS,
  type WaterAvailability,
} from "@/lib/agriculture/context";

export interface FormState {
  zoneId: string;
  seasonId: string;
  soilId: string;
  waterAvailability: WaterAvailability;
  talukaId: string;
}

const zoneLabels: Record<string, string> = {
  "heavy-rainfall": "Heavy Rainfall Belt (West)",
  "central-irrigated": "Central / Irrigated Belt",
  "arid-eastern": "Arid / Eastern Belt",
};

const seasonLabels: Record<string, string> = {
  kharif: "Kharif (Monsoon)",
  rabi: "Rabi (Post-Monsoon)",
  summer: "Summer",
  perennial: "Perennial / Orchard Cycle",
};

const soilLabels: Record<string, string> = {
  "deep-black": "Deep Black (Regur)",
  "medium-black": "Medium Black",
  "shallow-black": "Shallow Black",
  "alluvial-loam": "Alluvial Loam",
  laterite: "Laterite / Hill Soil",
  "sandy-loam": "Sandy Loam",
};

const waterLabels: Record<WaterAvailability, string> = {
  rainfed: "Rainfed only",
  limited: "Limited irrigation",
  moderate: "Moderate irrigation",
  assured: "Assured irrigation",
};

export const TALUKAS_BY_ZONE: Record<string, Array<{ id: string; name: string }>> = {
  "heavy-rainfall": [
    { id: "igatpuri", name: "Igatpuri" },
    { id: "trimbakeshwar", name: "Trimbakeshwar" },
    { id: "peth", name: "Peth" },
    { id: "surgana", name: "Surgana" },
  ],
  "central-irrigated": [
    { id: "niphad", name: "Niphad" },
    { id: "dindori", name: "Dindori" },
    { id: "nashik", name: "Nashik" },
    { id: "sinnar", name: "Sinnar" },
    { id: "chandwad", name: "Chandwad" },
  ],
  "arid-eastern": [
    { id: "malegaon", name: "Malegaon" },
    { id: "nandgaon", name: "Nandgaon" },
    { id: "yeola", name: "Yeola" },
    { id: "deola", name: "Deola" },
  ],
};

function Select({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
        <Icon size={13} aria-hidden />
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ContextSelects({
  form,
  onChange,
  disabled,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  disabled?: boolean;
}) {
  const talukas = TALUKAS_BY_ZONE[form.zoneId] ?? [];
  const validTaluka = talukas.some((t) => t.id === form.talukaId);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Select
        icon={MapPin}
        label="Zone"
        value={form.zoneId}
        options={ZONE_IDS.map((z) => ({ value: z, label: zoneLabels[z] ?? z }))}
        onChange={(v) =>
          onChange({
            ...form,
            zoneId: v,
            talukaId: (TALUKAS_BY_ZONE[v] ?? [])[0]?.id ?? "",
          })
        }
        disabled={disabled}
      />
      <Select
        icon={MapPin}
        label="Taluka"
        value={validTaluka ? form.talukaId : ""}
        options={[{ value: "", label: "District-level" }, ...talukas.map((t) => ({ value: t.id, label: t.name }))]}
        onChange={(v) => onChange({ ...form, talukaId: v })}
        disabled={disabled}
      />
      <Select
        icon={CalendarDays}
        label="Season"
        value={form.seasonId}
        options={SEASON_IDS.map((s) => ({ value: s, label: seasonLabels[s] ?? s }))}
        onChange={(v) => onChange({ ...form, seasonId: v })}
        disabled={disabled}
      />
      <Select
        icon={Layers}
        label="Soil"
        value={form.soilId}
        options={SOIL_IDS.map((s) => ({ value: s, label: soilLabels[s] ?? s }))}
        onChange={(v) => onChange({ ...form, soilId: v })}
        disabled={disabled}
      />
      <Select
        icon={Droplets}
        label="Water"
        value={form.waterAvailability}
        options={WATER_AVAILABILITY_LEVELS.map((w) => ({ value: w, label: waterLabels[w] }))}
        onChange={(v) => onChange({ ...form, waterAvailability: v as WaterAvailability })}
        disabled={disabled}
      />
    </div>
  );
}

export interface PresetDemo {
  id: string;
  name: string;
  context: FormState & { irrigationMethod?: string; riskPreference?: string };
}

export const PRESET_DEMOS: PresetDemo[] = [
  {
    id: "igatpuri-monsoon-paddy",
    name: "Igatpuri Monsoon Paddy",
    context: {
      zoneId: "heavy-rainfall",
      seasonId: "kharif",
      soilId: "laterite",
      waterAvailability: "rainfed",
      talukaId: "igatpuri",
      irrigationMethod: "none",
    },
  },
  {
    id: "niphad-irrigated-onion",
    name: "Niphad Irrigated Onion",
    context: {
      zoneId: "central-irrigated",
      seasonId: "rabi",
      soilId: "medium-black",
      waterAvailability: "assured",
      talukaId: "niphad",
      irrigationMethod: "drip",
    },
  },
  {
    id: "niphad-export-grapes",
    name: "Niphad Export Grapes",
    context: {
      zoneId: "central-irrigated",
      seasonId: "perennial",
      soilId: "deep-black",
      waterAvailability: "assured",
      talukaId: "niphad",
      irrigationMethod: "drip",
      riskPreference: "growth",
    },
  },
  {
    id: "malegaon-drought-bajra",
    name: "Malegaon Drought Bajra",
    context: {
      zoneId: "arid-eastern",
      seasonId: "kharif",
      soilId: "shallow-black",
      waterAvailability: "rainfed",
      talukaId: "malegaon",
      irrigationMethod: "none",
      riskPreference: "conservative",
    },
  },
  {
    id: "sinnar-pomegranate",
    name: "Sinnar Pomegranate",
    context: {
      zoneId: "central-irrigated",
      seasonId: "perennial",
      soilId: "medium-black",
      waterAvailability: "moderate",
      talukaId: "sinnar",
      irrigationMethod: "drip",
      riskPreference: "balanced",
    },
  },
];
