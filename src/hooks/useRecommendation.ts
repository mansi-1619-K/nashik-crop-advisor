"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  RecommendationRequest,
  RecommendationResponse,
  RegionKey,
  SeasonKey,
  SoilKey,
  WeatherResponse,
  WaterKey,
} from "@/lib/types";

export interface RecommendationState {
  params: RecommendationRequest;
  recommendation: RecommendationResponse | null;
  weather: WeatherResponse | null;
  loadingRecommendation: boolean;
  loadingWeather: boolean;
  error: string | null;
  setParam: <K extends keyof RecommendationRequest>(
    key: K,
    value: RecommendationRequest[K],
  ) => void;
  setParams: (next: RecommendationRequest) => void;
  retry: () => void;
}

export function useRecommendation(): RecommendationState {
  const [params, setParamsState] = useState<RecommendationRequest>({
    region: "central",
    season: "rabi",
    soil: "black",
    water: "high",
  });
  const [recommendation, setRecommendation] =
    useState<RecommendationResponse | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const recAbortRef = useRef<AbortController | null>(null);
  const weatherAbortRef = useRef<AbortController | null>(null);
  const paramsRef = useRef(params);
  /** True between a manual Retry/Refresh click and the next weather settle —
   *  used to toast the outcome of that explicit action only (plan 5.2),
   *  not the background refetches that follow param changes. */
  const manualRefreshRef = useRef(false);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const setParam = useCallback(
    <K extends keyof RecommendationRequest>(
      key: K,
      value: RecommendationRequest[K],
    ) => {
      setParamsState((prev) => ({ ...prev, [key]: value }));
      setLoadingRecommendation(true);
      if (key === "region") setLoadingWeather(true);
    },
    [],
  );

  const setParams = useCallback((next: RecommendationRequest) => {
    const prevRegion = paramsRef.current.region;
    setParamsState(next);
    setLoadingRecommendation(true);
    if (next.region !== prevRegion) setLoadingWeather(true);
  }, []);

  const retry = useCallback(() => {
    manualRefreshRef.current = true;
    setLoadingRecommendation(true);
    setLoadingWeather(true);
    setRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    recAbortRef.current?.abort();
    recAbortRef.current = controller;

    fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return res.json() as Promise<RecommendationResponse>;
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setRecommendation(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error
            ? err.message
            : "Unable to load recommendations.";
        setError(message);
        // Plan 5.2: API errors were inline-only — now also transient.
        // Stable id = sonner updates the existing toast instead of stacking
        // a new one on every param change that fails the same way.
        toast.error(`Advisory request failed — ${message}`, {
          id: "recommend-error",
        });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRecommendation(false);
      });

    return () => controller.abort();
  }, [params, retryKey]);

  useEffect(() => {
    const controller = new AbortController();
    weatherAbortRef.current?.abort();
    weatherAbortRef.current = controller;

    fetch(`/api/weather?region=${params.region}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
        return res.json() as Promise<WeatherResponse>;
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setWeather(data);
          if (manualRefreshRef.current) {
            manualRefreshRef.current = false;
            toast.success(
              data.source === "open-meteo"
                ? "Microclimate refreshed — live Open-Meteo data"
                : "Microclimate refreshed — offline estimate",
              { id: "weather-refresh", duration: 3500 },
            );
          }
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (manualRefreshRef.current) manualRefreshRef.current = false;
        const message =
          err instanceof Error
            ? `Weather unavailable: ${err.message}`
            : "Weather unavailable.";
        setError(message);
        toast.error(message, { id: "weather-error" });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingWeather(false);
      });

    return () => controller.abort();
  }, [params.region, retryKey]);

  return {
    params,
    recommendation,
    weather,
    loadingRecommendation,
    loadingWeather,
    error,
    setParam,
    setParams,
    retry,
  };
}

export type { RegionKey, SeasonKey, SoilKey, WaterKey };
