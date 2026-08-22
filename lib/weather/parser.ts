import type { WeatherCodeGroup } from "./types";

export interface ParsedWeatherCode {
  code: number;
  description: string;
  group: WeatherCodeGroup;
}

interface WmoEntry {
  description: string;
  group: WeatherCodeGroup;
}

export const WMO_CODES: Record<number, WmoEntry> = {
  0: { description: "Clear sky", group: "clear" },
  1: { description: "Mainly clear", group: "clear" },
  2: { description: "Partly cloudy", group: "cloudy" },
  3: { description: "Overcast", group: "cloudy" },
  45: { description: "Fog", group: "fog" },
  48: { description: "Depositing rime fog", group: "fog" },
  51: { description: "Light drizzle", group: "drizzle" },
  53: { description: "Moderate drizzle", group: "drizzle" },
  55: { description: "Dense drizzle", group: "drizzle" },
  56: { description: "Light freezing drizzle", group: "freezing-rain" },
  57: { description: "Dense freezing drizzle", group: "freezing-rain" },
  61: { description: "Slight rain", group: "rain" },
  63: { description: "Moderate rain", group: "rain" },
  65: { description: "Heavy rain", group: "rain" },
  66: { description: "Light freezing rain", group: "freezing-rain" },
  67: { description: "Heavy freezing rain", group: "freezing-rain" },
  71: { description: "Slight snow fall", group: "snow" },
  73: { description: "Moderate snow fall", group: "snow" },
  75: { description: "Heavy snow fall", group: "snow" },
  77: { description: "Snow grains", group: "snow" },
  80: { description: "Slight rain showers", group: "showers" },
  81: { description: "Moderate rain showers", group: "showers" },
  82: { description: "Violent rain showers", group: "showers" },
  85: { description: "Slight snow showers", group: "snow" },
  86: { description: "Heavy snow showers", group: "snow" },
  95: { description: "Thunderstorm", group: "thunderstorm" },
  96: { description: "Thunderstorm with slight hail", group: "thunderstorm" },
  99: { description: "Thunderstorm with heavy hail", group: "thunderstorm" },
};

const UNKNOWN_ENTRY: WmoEntry = { description: "Unknown conditions", group: "cloudy" };

export function parseWeatherCode(code: number): ParsedWeatherCode {
  const entry = WMO_CODES[code] ?? UNKNOWN_ENTRY;
  return { code, description: entry.description, group: entry.group };
}

export function isWetCode(code: number): boolean {
  const group = parseWeatherCode(code).group;
  return (
    group === "drizzle" ||
    group === "rain" ||
    group === "freezing-rain" ||
    group === "snow" ||
    group === "showers" ||
    group === "thunderstorm"
  );
}
