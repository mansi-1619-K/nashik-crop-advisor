import type { DataSourceClass } from "@/lib/types/common";

export type WeatherCodeGroup =
  | "clear"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "freezing-rain"
  | "snow"
  | "showers"
  | "thunderstorm";

export interface CurrentConditions {
  observedAt: string;
  temperatureC: number;
  apparentTemperatureC: number | null;
  humidityPercent: number;
  precipitationMm: number;
  weatherCode: number;
  windKmh: number;
}

export interface DailyForecastDay {
  date: string;
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
  precipitationSumMm: number;
  precipitationProbabilityMaxPercent: number | null;
  windMaxKmh: number;
}

export interface GeoPoint {
  talukaId: string;
  talukaName: string;
  lat: number;
  lng: number;
}

export interface WeatherBundle {
  location: GeoPoint;
  current: CurrentConditions;
  daily: DailyForecastDay[];
  timezone: string;
  fetchedAt: string;
  source: "open-meteo";
  sourceClass: Extract<DataSourceClass, "live">;
}

export type WeatherFreshness = "live" | "cached-fresh" | "cached-stale";

export interface WeatherResult {
  bundle: WeatherBundle;
  freshness: WeatherFreshness;
}
