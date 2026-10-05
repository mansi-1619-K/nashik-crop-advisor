"use client";

import { motion } from "motion/react";
import {
  AlertTriangle,
  Bell,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  Info,
  RefreshCw,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
} from "lucide-react";
import type { ComponentType } from "react";
import type { AlertLevel, WeatherDay, WeatherResponse } from "@/lib/types";
import { REGIONS, formatDateLabel, wmoMeta } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { SectionCard, SectionTitle, Skeleton } from "./ui";
import { InteractiveHoverButton } from "./block/interactive-hover-button";

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  sun: Sun,
  cloud: CloudSun,
  rain: CloudRain,
  thunder: CloudLightning,
  fog: CloudFog,
  snow: CloudSnow,
};

const ALERT_ICONS: Record<AlertLevel, ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  critical: Bell,
};

const ALERT_TONES: Record<
  AlertLevel,
  { box: string; icon: string; chip: string }
> = {
  info: {
    box: "border-sage/30 bg-sage-light/50",
    icon: "text-sage",
    chip: "bg-sage-light text-olive",
  },
  warning: {
    box: "border-harvest-200/50 bg-harvest-50/60",
    icon: "text-harvest-600",
    chip: "bg-harvest-100 text-harvest-700",
  },
  critical: {
    box: "border-terracotta/20 bg-terracotta-light/50",
    icon: "text-terracotta",
    chip: "bg-terracotta-light text-terracotta",
  },
};

function WeatherIcon({
  code,
  className,
}: {
  code: number;
  className?: string;
}) {
  const meta = wmoMeta(code);
  const Icon = CATEGORY_ICONS[meta.category] ?? CloudSun;
  return (
    <span
      role="img"
      aria-label={meta.label}
      title={meta.label}
      className="inline-flex"
    >
      <Icon className={className} aria-hidden />
    </span>
  );
}

function ForecastStrip({
  forecast,
  currentCode,
}: {
  forecast: WeatherDay[];
  currentCode: number;
}) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        {forecast.map((day, i) => {
          return (
            <div
              key={day.date}
              className={cn(
                "w-[76px] shrink-0 rounded-lg border px-2 py-3 text-center transition-all duration-300",
                i === 0
                  ? "border-moss/30 bg-moss-light/50 shadow-1"
                  : "border-border/30 bg-surface/40 hover:border-border/60",
              )}
            >
              <p className="text-[11px] font-semibold text-ink-secondary">
                {i === 0 ? "Today" : formatDateLabel(day.date).split(",")[0]}
              </p>
              <div className="my-2.5 flex justify-center">
                <WeatherIcon
                  code={i === 0 ? currentCode : day.weatherCode}
                  className="h-5 w-5 text-ink-secondary"
                />
              </div>
              <p className="text-sm font-bold text-ink">
                {Math.round(day.tempMax)}°
              </p>
              <p className="text-[11px] text-ink-muted">
                {Math.round(day.tempMin)}°
              </p>
              <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] text-sage">
                <Umbrella className="h-3 w-3" aria-hidden />
                {day.precipitation.toFixed(0)}mm
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WeatherWidget({
  region,
  weather,
  loading,
  onRefresh,
}: {
  region: string;
  weather: WeatherResponse | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const regionMeta = REGIONS[region as keyof typeof REGIONS];
  const current = weather?.current;

  return (
    <SectionCard className="flex h-full flex-col print-hide">
      <SectionTitle
        icon={<CloudSun className="h-4 w-4" aria-hidden />}
        title={`Live Microclimate · ${regionMeta.shortName}`}
        subtitle={regionMeta.climate}
        right={
          <div className="flex items-center gap-2">
            {weather ? (
              <span className="rounded-full bg-clay-light px-2.5 py-0.5 text-[10px] font-medium text-ink-secondary">
                {weather.source === "open-meteo"
                  ? "Open-Meteo · live"
                  : "offline estimate"}
              </span>
            ) : null}
            <InteractiveHoverButton
              type="button"
              onClick={onRefresh}
              disabled={loading}
              icon={
                <RefreshCw
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    loading && "animate-spin",
                  )}
                  aria-hidden
                />
              }
              className="px-3.5 py-2 text-xs"
            >
              Refresh
            </InteractiveHoverButton>
          </div>
        }
      />

      {/* flex-1: this block absorbs leftover column height so the card
          never leaves dead whitespace under it (params column is taller) */}
      <div className="flex-1 px-6 pt-5">
        {loading && !weather ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : current ? (
          <div className="grid grid-cols-1 gap-4 lg:h-full lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)]">
            <div className="min-w-0 rounded-lg border border-border/40 bg-canvas-warm/40 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-surface text-moss ring-1 ring-border/30">
                  <WeatherIcon code={current.weatherCode} className="h-8 w-8" />
                </div>
                <div className="min-w-0">
                  <p className="text-3xl font-bold tracking-tight text-ink">
                    {Math.round(current.temperature)}
                    <span className="text-lg text-ink-muted">°C</span>
                  </p>
                  <p className="truncate text-xs text-ink-secondary">
                    {wmoMeta(current.weatherCode).label}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-2 border-t border-border/30 pt-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-muted">
                    <Thermometer className="h-3 w-3 shrink-0" aria-hidden />{" "}
                    Range
                  </p>
                  <p className="truncate text-sm font-semibold text-ink">
                    {weather.forecast[0]
                      ? `${Math.round(weather.forecast[0].tempMax)}° / ${Math.round(weather.forecast[0].tempMin)}°`
                      : "—"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-muted">
                    <Droplets className="h-3 w-3 shrink-0" aria-hidden />{" "}
                    Humidity
                  </p>
                  <p className="truncate text-sm font-semibold text-ink">
                    {Math.round(current.humidity)}%
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-muted">
                    <Wind className="h-3 w-3 shrink-0" aria-hidden /> Wind
                  </p>
                  <p className="truncate text-sm font-semibold text-ink">
                    {Math.round(current.windSpeed)} km/h
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/30 p-3.5">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
                7-day forecast · precipitation
              </p>
              <ForecastStrip
                forecast={weather.forecast}
                currentCode={current.weatherCode}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="px-6 py-5">
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          <Bell className="h-3.5 w-3.5" aria-hidden />
          Farming Advisory Alerts
        </p>
        <div className="space-y-2">
          {weather?.alerts.map((alert) => {
            const tone = ALERT_TONES[alert.level];
            const Icon = ALERT_ICONS[alert.level];
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3.5",
                  tone.box,
                )}
              >
                <Icon
                  className={cn("mt-0.5 h-4 w-4 shrink-0", tone.icon)}
                  aria-hidden
                />
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                    {alert.title}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        tone.chip,
                      )}
                    >
                      {alert.level}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">
                    {alert.message}
                  </p>
                </div>
              </motion.div>
            );
          })}
          {!weather && !loading ? (
            <p className="text-sm text-ink-muted">
              Weather alerts unavailable.
            </p>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
