import type {
  RegionKey,
  WeatherAlert,
  WeatherDay,
  WeatherResponse,
} from "./types";
import { REGIONS } from "./constants";

export interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
    weather_code?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    relative_humidity_2m_max?: number[];
    wind_speed_10m_max?: number[];
    precipitation_sum?: number[];
  };
}

export function buildWeatherUrl(region: RegionKey): string {
  const { lat, lon } = REGIONS[region];
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current:
      "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,wind_speed_10m_max,precipitation_sum",
    timezone: "Asia/Kolkata",
    forecast_days: "7",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function buildFallbackWeather(region: RegionKey): {
  current: WeatherResponse["current"];
  forecast: WeatherDay[];
} {
  const base = REGIONS[region];
  const today = new Date();
  const forecast: WeatherDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    forecast.push({
      date: d.toISOString().slice(0, 10),
      weatherCode: i < 2 ? 2 : i === 3 ? 80 : i < 5 ? 3 : 61,
      tempMax: Math.round(base.lat < 20 ? 27 + i * 0.4 : 32 + i * 0.4),
      tempMin: Math.round(base.lat < 20 ? 18 + i * 0.3 : 21 + i * 0.3),
      humidity: Math.round(base.lat < 20 ? 82 - i : 64 - i),
      windSpeed: Math.round(9 + i * 1.2),
      precipitation: i === 3 ? 12 : i === 5 ? 8 : i === 6 ? 6 : 0,
    });
  }
  return {
    current: {
      temperature: forecast[0].tempMax - 4,
      humidity: forecast[0].humidity + 6,
      windSpeed: forecast[0].windSpeed,
      precipitation: forecast[0].precipitation,
      weatherCode: forecast[0].weatherCode,
    },
    forecast,
  };
}

export function mapWeatherResponse(
  region: RegionKey,
  raw: OpenMeteoResponse,
): WeatherResponse {
  const forecast: WeatherDay[] = (raw.daily?.time ?? []).map((date, i) => ({
    date,
    weatherCode: raw.daily?.weather_code?.[i] ?? 0,
    tempMax: raw.daily?.temperature_2m_max?.[i] ?? 0,
    tempMin: raw.daily?.temperature_2m_min?.[i] ?? 0,
    humidity: raw.daily?.relative_humidity_2m_max?.[i] ?? 0,
    windSpeed: raw.daily?.wind_speed_10m_max?.[i] ?? 0,
    precipitation: raw.daily?.precipitation_sum?.[i] ?? 0,
  }));

  return {
    region,
    current: {
      temperature: raw.current?.temperature_2m ?? forecast[0]?.tempMax ?? 0,
      humidity: raw.current?.relative_humidity_2m ?? forecast[0]?.humidity ?? 0,
      windSpeed: raw.current?.wind_speed_10m ?? forecast[0]?.windSpeed ?? 0,
      precipitation: raw.current?.precipitation ?? forecast[0]?.precipitation ?? 0,
      weatherCode: raw.current?.weather_code ?? forecast[0]?.weatherCode ?? 0,
    },
    forecast,
    alerts: buildAdvisoryAlerts(region, forecast, {
      temperature: raw.current?.temperature_2m ?? 0,
      humidity: raw.current?.relative_humidity_2m ?? 0,
      windSpeed: raw.current?.wind_speed_10m ?? 0,
    }),
    source: "open-meteo",
  };
}

export function buildFallbackResponse(region: RegionKey): WeatherResponse {
  const { current, forecast } = buildFallbackWeather(region);
  return {
    region,
    current,
    forecast,
    alerts: buildAdvisoryAlerts(region, forecast, current),
    source: "fallback",
  };
}

export function buildAdvisoryAlerts(
  region: RegionKey,
  forecast: WeatherDay[],
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  },
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const regionName = REGIONS[region].shortName;

  const nextRain = forecast.find((d) => d.precipitation > 5);
  const totalPrecip = forecast.reduce((sum, d) => sum + (d.precipitation ?? 0), 0);
  const anyThunder = forecast.some((d) => d.weatherCode >= 95);
  const humidDays = forecast.filter((d) => d.humidity >= 80).length;

  if (current.humidity >= 82) {
    alerts.push({
      id: "humidity-fungal",
      level: "warning",
      title: "High humidity — fungal pressure rising",
      message:
        region === "central"
          ? `${regionName}: Relative humidity is very high. Downy and powdery mildew pressure on grapes and onions is elevated — keep the scheduled spray calendar and improve canopy airflow.`
          : `${regionName}: High relative humidity favours blast, blight and mildew. Hold off irrigation and scout field edges for early lesions.`,
    });
  }

  if (nextRain) {
    const rainDate = new Date(nextRain.date + "T00:00:00").toLocaleDateString(
      "en-IN",
      { weekday: "long", day: "numeric", month: "short" },
    );
    alerts.push({
      id: "rain-forecast",
      level: "info",
      title: `Rain expected ${rainDate} (${nextRain.precipitation.toFixed(1)}mm)`,
      message:
        region === "central" && forecast[0].precipitation > 2
          ? "Rain during the onion harvest window risks fungal rot and skin staining. If bulbs are mature, lift and windrow-cure them before the wet spell."
          : "Plan operations around the wet window — avoid fertilizer top-dressing and post-emergence sprays right before rainfall.",
    });
  }

  if (anyThunder) {
    alerts.push({
      id: "thunderstorm",
      level: "critical",
      title: "Thunderstorm in the 7-day outlook",
      message:
        "Hail and squalls can shred young canopies and fruit. Secure trellises and netting; keep livestock and workers indoors during storm hours.",
    });
  }

  if (current.windSpeed >= 25) {
    alerts.push({
      id: "wind-spray",
      level: "warning",
      title: "Strong winds — avoid spraying",
      message: `Sustained winds near ${Math.round(current.windSpeed)} km/h cause spray drift and poor canopy coverage. Postpone foliar sprays to a calmer morning.`,
    });
  }

  if (region === "arid" && totalPrecip < 5) {
    alerts.push({
      id: "arid-drought",
      level: "warning",
      title: "Dry week ahead for the eastern belt",
      message:
        `${regionName}: Less than 5mm rain expected over 7 days. Shield young seedlings and trigger life-saving irrigation at the 35-day crop stage.`,
    });
  }

  if (region === "heavy_rainfall" && totalPrecip > 40) {
    alerts.push({
      id: "ghat-saturation",
      level: "warning",
      title: "Heavy rain — watch for waterlogging",
      message:
        `${regionName}: Sustained monsoon rain expected. Open field drains around paddy and vegetable beds; delay urea top-dressing until the soil dries.`,
    });
  }

  if (region === "central" && humidDays >= 4 && forecast[0].tempMax >= 30) {
    alerts.push({
      id: "disease-hot",
      level: "warning",
      title: "Warm + humid — disease watch",
      message:
        "Multiple humid days with day temperatures near 30°C create an ideal window for purple blotch and early blight. Tighten the protective fungicide schedule.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-clear",
      level: "info",
      title: "Conditions favourable for field work",
      message:
        "No adverse weather triggers detected in the 7-day outlook for your micro-region. A good window for sowing, spraying and harvest operations.",
    });
  }

  return alerts.slice(0, 5);
}