import type { Severity } from "@/lib/types/common";
import { isWetCode } from "@/lib/weather/parser";
import type { WeatherBundle } from "@/lib/weather/types";

export type WeatherSignalType =
  | "excessive-rainfall"
  | "heat-stress"
  | "fungal-risk-window"
  | "spraying-suitability"
  | "high-wind-spraying-risk"
  | "irrigation-opportunity"
  | "moisture-stress";

export interface WeatherSignal {
  type: WeatherSignalType;
  severity: Exclude<Severity, "none">;
  confidence: "low" | "medium" | "high";
  reason: string;
  recommendedAction: string;
  validUntil: string;
}

const SEVERITY_ORDER: Record<WeatherSignal["severity"], number> = {
  high: 0,
  moderate: 1,
  low: 2,
};

function confidenceForDayIndex(index: number): "low" | "medium" | "high" {
  if (index <= 1) return "high";
  if (index <= 3) return "medium";
  return "low";
}

function endOfDayIst(date: string): string {
  return `${date}T23:59:59+05:30`;
}

export function generateWeatherSignals(bundle: WeatherBundle): WeatherSignal[] {
  const signals: WeatherSignal[] = [];
  const days = bundle.daily;
  if (days.length === 0) return signals;

  const wet = (i: number): boolean =>
    isWetCode(days[i].weatherCode) ||
    (days[i].precipitationProbabilityMaxPercent ?? 0) >= 60 ||
    days[i].precipitationSumMm >= 2;

  let hasRainfallSignal = false;

  for (let i = 0; i < Math.min(days.length, 7); i++) {
    const day = days[i];
    if (day.precipitationSumMm >= 50) {
      signals.push({
        type: "excessive-rainfall",
        severity: "high",
        confidence: confidenceForDayIndex(i),
        reason: `Heavy rainfall of ~${day.precipitationSumMm.toFixed(0)} mm forecast on ${day.date}.`,
        recommendedAction:
          "Ensure field drainage is clear; avoid fertilizer or pesticide application during the event; watch for waterlogging.",
        validUntil: endOfDayIst(day.date),
      });
      hasRainfallSignal = true;
    } else if (day.precipitationSumMm >= 25 && !hasRainfallSignal) {
      signals.push({
        type: "excessive-rainfall",
        severity: "moderate",
        confidence: confidenceForDayIndex(i),
        reason: `Notable rainfall of ~${day.precipitationSumMm.toFixed(0)} mm forecast on ${day.date}.`,
        recommendedAction:
          "Plan around a likely wet day; check drainage and postpone spraying or top dressing.",
        validUntil: endOfDayIst(day.date),
      });
      hasRainfallSignal = true;
    }
  }

  for (let i = 0; i < Math.min(days.length, 5); i++) {
    const tMax = days[i].tempMaxC;
    if (tMax >= 40 || tMax >= 37) {
      signals.push({
        type: "heat-stress",
        severity: tMax >= 40 ? "high" : "moderate",
        confidence: confidenceForDayIndex(i),
        reason: `High temperature of ${tMax.toFixed(0)}°C forecast on ${days[i].date}; heat stress is plausible for sensitive crops.`,
        recommendedAction:
          "Schedule irrigation for early morning or evening; avoid mid-day field operations and chemical sprays.",
        validUntil: endOfDayIst(days[i].date),
      });
    }
  }

  const nextThreeWetDays = days.slice(0, 3).filter((_, i) => wet(i)).length;
  if (nextThreeWetDays >= 2 && bundle.current.humidityPercent >= 78) {
    const highPressure =
      bundle.current.humidityPercent >= 85 && days[0].tempMaxC >= 20 && days[0].tempMaxC <= 30;
    signals.push({
      type: "fungal-risk-window",
      severity: highPressure ? "high" : "moderate",
      confidence: nextThreeWetDays === 3 ? "medium" : confidenceForDayIndex(nextThreeWetDays),
      reason: `Humidity at ${bundle.current.humidityPercent.toFixed(0)}% with ${nextThreeWetDays} wet day(s) in the next three days — conditions are favorable for increased fungal disease pressure on susceptible crops.`,
      recommendedAction:
        "Consider preventive plant-protection measures per local guidance; this is an advisory signal, not a disease diagnosis.",
      validUntil: endOfDayIst(days[Math.min(2, days.length - 1)].date),
    });
  }

  if (days.length > 0) {
    const tomorrow = days[0];
    const tomorrowWind = tomorrow.windMaxKmh;
    const tomorrowProb = tomorrow.precipitationProbabilityMaxPercent ?? 100;
    if (tomorrowWind >= 35) {
      signals.push({
        type: "high-wind-spraying-risk",
        severity: "high",
        confidence: confidenceForDayIndex(0),
        reason: `Strong winds up to ${tomorrowWind.toFixed(0)} km/h forecast tomorrow.`,
        recommendedAction:
          "Avoid spraying tomorrow — severe drift risk to neighbouring fields and poor deposition.",
        validUntil: endOfDayIst(tomorrow.date),
      });
    } else if (tomorrowWind >= 25) {
      signals.push({
        type: "high-wind-spraying-risk",
        severity: "moderate",
        confidence: confidenceForDayIndex(0),
        reason: `Winds up to ${tomorrowWind.toFixed(0)} km/h forecast tomorrow.`,
        recommendedAction: "Prefer early-morning spraying only if winds stay low; otherwise postpone.",
        validUntil: endOfDayIst(tomorrow.date),
      });
    } else if (
      tomorrowWind < 12 &&
      tomorrowProb <= 30 &&
      !isWetCode(tomorrow.weatherCode)
    ) {
      signals.push({
        type: "spraying-suitability",
        severity: "low",
        confidence: "high",
        reason: `Tomorrow looks calm: wind ≤ ${tomorrowWind.toFixed(0)} km/h, rain probability ${tomorrowProb}%.`,
        recommendedAction:
          "Conditions appear suitable for spraying operations in the early morning; verify locally before mixing chemicals.",
        validUntil: endOfDayIst(tomorrow.date),
      });
    }
  }

  const dryFirstThree =
    days.slice(0, 3).every((d) => d.precipitationSumMm < 2) &&
    days.slice(0, 3).every((d) => (d.precipitationProbabilityMaxPercent ?? 50) < 35);
  if (!hasRainfallSignal && dryFirstThree) {
    signals.push({
      type: "irrigation-opportunity",
      severity: "low",
      confidence: "medium",
      reason: "Little to no rainfall expected over the next three days.",
      recommendedAction:
        "This is a good window to plan irrigation before moisture deficit develops; adjust quantity to crop stage.",
      validUntil: endOfDayIst(days[Math.min(2, days.length - 1)].date),
    });

    const hotDry = days
      .slice(0, 4)
      .some((d) => d.tempMaxC >= 34 && d.precipitationSumMm < 2);
    if (hotDry) {
      signals.push({
        type: "moisture-stress",
        severity: "moderate",
        confidence: "medium",
        reason:
          "A hot, mostly dry stretch is forecast; soil moisture may decline quickly in light-textured soils.",
        recommendedAction:
          "Prioritize irrigation scheduling and moisture conservation (mulching) for standing crops.",
        validUntil: endOfDayIst(days[Math.min(3, days.length - 1)].date),
      });
    }
  }

  return signals.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.type.localeCompare(b.type),
  );
}
