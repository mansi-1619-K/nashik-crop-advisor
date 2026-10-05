import type {
  PresetDefinition,
  RegionKey,
  SeasonKey,
  SoilKey,
  WaterKey,
} from "./types";

export interface RegionMeta {
  key: RegionKey;
  name: string;
  shortName: string;
  tehsils: string;
  climate: string;
  soil: string;
  lat: number;
  lon: number;
  monsoonRainfall: string;
}

export const REGIONS: Record<RegionKey, RegionMeta> = {
  heavy_rainfall: {
    key: "heavy_rainfall",
    name: "Heavy Rainfall Belt",
    shortName: "Igatpuri / Trimbakeshwar",
    tehsils: "Igatpuri, Trimbakeshwar, Western Ghats",
    climate: "2500mm+ monsoon, cool & humid, misty slopes",
    soil: "Acidic red / laterite, porous, well-drained",
    lat: 19.6953,
    lon: 73.5594,
    monsoonRainfall: "2500–3500 mm",
  },
  central: {
    key: "central",
    name: "Central Irrigated Belt",
    shortName: "Niphad / Nashik / Sinnar",
    tehsils: "Niphad, Dindori, Nashik, Sinnar (Godavari basin)",
    climate: "Moderate rainfall (700–900mm), hot summers, canal & drip irrigation",
    soil: "Deep black cotton soil (Vertisol), high water retention",
    lat: 20.0782,
    lon: 74.1086,
    monsoonRainfall: "700–900 mm",
  },
  arid: {
    key: "arid",
    name: "Arid / Rainshadow Eastern Belt",
    shortName: "Malegaon / Yeola",
    tehsils: "Malegaon, Nandgaon, Yeola",
    climate: "Low rainfall (500–600mm), hot & dry, rain-shadow of Sahyadris",
    soil: "Shallow calcareous / gravelly, moisture-stressed",
    lat: 20.5523,
    lon: 74.5298,
    monsoonRainfall: "500–600 mm",
  },
};

export interface SeasonMeta {
  key: SeasonKey;
  name: string;
  window: string;
  rainfall: string;
  temperature: string;
}

export const SEASONS: Record<SeasonKey, SeasonMeta> = {
  kharif: {
    key: "kharif",
    name: "Kharif",
    window: "June – October",
    rainfall: "Monsoon-driven",
    temperature: "25–33 °C",
  },
  rabi: {
    key: "rabi",
    name: "Rabi",
    window: "October – March",
    rainfall: "Post-monsoon (needs irrigation)",
    temperature: "12–30 °C",
  },
  summer: {
    key: "summer",
    name: "Summer (Zaid)",
    window: "March – June",
    rainfall: "None (fully irrigated)",
    temperature: "28–42 °C",
  },
};

export interface SoilMeta {
  key: SoilKey;
  name: string;
  traits: string;
}

export const SOILS: Record<SoilKey, SoilMeta> = {
  black: {
    key: "black",
    name: "Deep Black Cotton",
    traits: "Vertisol — high clay, high water retention, swelling/shrinking",
  },
  red: {
    key: "red",
    name: "Red / Laterite",
    traits: "Alfisol — porous, slightly acidic, well-drained",
  },
  loamy: {
    key: "loamy",
    name: "Alluvial / Loamy",
    traits: "Fertile river basins, high organic matter",
  },
};

export interface WaterMeta {
  key: WaterKey;
  name: string;
  traits: string;
}

export const WATER_LEVELS: Record<WaterKey, WaterMeta> = {
  low: {
    key: "low",
    name: "Low",
    traits: "Rainfed only / dryland",
  },
  medium: {
    key: "medium",
    name: "Medium",
    traits: "Seasonal canal, seasonal dug-well",
  },
  high: {
    key: "high",
    name: "High",
    traits: "Assured canal, round-the-year borewell, drip",
  },
};

export const PRESETS: PresetDefinition[] = [
  {
    id: "igatpuri-paddy",
    label: "Igatpuri Monsoon Paddy",
    description: "Heavy rain + Kharif + Red soil + High water",
    region: "heavy_rainfall",
    season: "kharif",
    soil: "red",
    water: "high",
  },
  {
    id: "niphad-grapes-onion",
    label: "Niphad Export Grapes / Onion",
    description: "Central + Rabi + Black soil + High water",
    region: "central",
    season: "rabi",
    soil: "black",
    water: "high",
  },
  {
    id: "malegaon-bajra-pomegranate",
    label: "Malegaon Drought Bajra / Pomegranate",
    description: "Arid + Kharif + Loamy soil + Low water",
    region: "arid",
    season: "kharif",
    soil: "loamy",
    water: "low",
  },
  {
    id: "sinnar-summer-pulses",
    label: "Sinnar Summer Pulses",
    description: "Central + Summer + Black soil + Medium water",
    region: "central",
    season: "summer",
    soil: "black",
    water: "medium",
  },
];

export interface WmoCodeMeta {
  label: string;
  category: "sun" | "cloud" | "rain" | "thunder" | "fog" | "snow";
}

export const WMO_CODES: Record<number, WmoCodeMeta> = {
  0: { label: "Clear sky", category: "sun" },
  1: { label: "Mainly clear", category: "sun" },
  2: { label: "Partly cloudy", category: "cloud" },
  3: { label: "Overcast", category: "cloud" },
  45: { label: "Fog", category: "fog" },
  48: { label: "Rime fog", category: "fog" },
  51: { label: "Light drizzle", category: "rain" },
  53: { label: "Drizzle", category: "rain" },
  55: { label: "Heavy drizzle", category: "rain" },
  56: { label: "Freezing drizzle", category: "rain" },
  57: { label: "Freezing drizzle", category: "rain" },
  61: { label: "Light rain", category: "rain" },
  63: { label: "Rain", category: "rain" },
  65: { label: "Heavy rain", category: "rain" },
  66: { label: "Freezing rain", category: "rain" },
  67: { label: "Freezing rain", category: "rain" },
  71: { label: "Light snow", category: "snow" },
  73: { label: "Snow", category: "snow" },
  75: { label: "Heavy snow", category: "snow" },
  77: { label: "Snow grains", category: "snow" },
  80: { label: "Light showers", category: "rain" },
  81: { label: "Rain showers", category: "rain" },
  82: { label: "Violent showers", category: "rain" },
  85: { label: "Snow showers", category: "snow" },
  86: { label: "Heavy snow showers", category: "snow" },
  95: { label: "Thunderstorm", category: "thunder" },
  96: { label: "Thunderstorm, hail", category: "thunder" },
  99: { label: "Severe thunderstorm", category: "thunder" },
};

export function wmoMeta(code: number): WmoCodeMeta {
  return WMO_CODES[code] ?? { label: "Unknown", category: "cloud" };
}

export function formatRupees(value: number): string {
  if (value >= 100000) {
    return `₹${(value / 100000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

export function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}