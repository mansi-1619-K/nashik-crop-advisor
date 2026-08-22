"use client";

import { useState } from "react";
import { Play, Loader2, Sprout } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ContextSelects, type FormState, PRESET_DEMOS } from "@/components/dashboard/context-selects";
import { WeatherStrip, type WeatherResponse } from "@/components/dashboard/weather-strip";
import {
  RecommendationCard,
  cropName,
} from "@/components/dashboard/recommendation-card";
import { WhatIfSimulator } from "@/components/simulator/what-if-simulator";
import { AiAdvisorPanel } from "@/components/dashboard/ai-advisor";
import type { AdvisoryResult } from "@/lib/ai/advisory";
import type { RecommendationOutput } from "@/lib/agriculture/results";
import type { SensitivityReport } from "@/lib/agriculture/sensitivity";

type RecommendResponse = RecommendationOutput & { weatherAvailable: boolean };

export function Workspace() {
  const [form, setForm] = useState<FormState>({
    zoneId: "central-irrigated",
    seasonId: "rabi",
    soilId: "medium-black",
    waterAvailability: "assured",
    talukaId: "niphad",
  });

  const [recs, setRecs] = useState<RecommendResponse | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [sim, setSim] = useState<SensitivityReport | null>(null);
  const [advisory, setAdvisory] = useState<AdvisoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(context: FormState = form) {
    setLoading(true);
    setError(null);
    try {
      const payloadContext = {
        ...context,
        talukaId: context.talukaId || undefined,
      };
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context: payloadContext }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data: RecommendResponse = await res.json();
      setRecs(data);

      if (context.talukaId) {
        const wRes = await fetch(`/api/weather?taluka=${encodeURIComponent(context.talukaId)}`);
        if (wRes.ok) setWeather(await wRes.json());
        else setWeather(null);
      }

      const simRes = await fetch("/api/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context: payloadContext }),
      });
      if (simRes.ok) setSim(await simRes.json());

      const advisoryRes = await fetch("/api/advisory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context: payloadContext }),
      });
      if (advisoryRes.ok) {
        const json = await advisoryRes.json();
        setAdvisory(json.advisory as AdvisoryResult);
      } else {
        setAdvisory(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <h2 className="mb-4 font-semibold text-zinc-900">Your farm context</h2>
        <ContextSelects form={form} onChange={setForm} disabled={loading} />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Predefined demo scenarios:
          </span>
          {PRESET_DEMOS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setForm({ ...p.context, talukaId: p.context.talukaId ?? "" });
                void analyze(p.context as FormState);
              }}
              className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => void analyze()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Play size={16} aria-hidden />}
            {loading ? "Analyzing…" : "Analyze my farm"}
          </button>
          {recs && !loading && (
            <span className="text-xs text-zinc-400">
              engine v{recs.engineVersion} · deterministic output
            </span>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </Card>

      {!recs && !loading && (
        <Card className="p-8 text-center">
          <Sprout size={28} className="mx-auto mb-3 text-emerald-600" aria-hidden />
          <p className="font-medium text-zinc-700">Configure your context and press “Analyze my farm”.</p>
          <p className="mt-1 text-sm text-zinc-500">
            The deterministic engine ranks all 11 crops against hard agronomic constraints — no AI involved.
          </p>
        </Card>
      )}

      {weather && <WeatherStrip data={weather} />}

      {recs && (
        <>
          <AiAdvisorPanel
            context={{
              zoneId: form.zoneId,
              seasonId: form.seasonId,
              soilId: form.soilId,
              waterAvailability: form.waterAvailability,
              talukaId: form.talukaId || undefined,
            }}
            advisory={advisory}
          />
          {recs.primary ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card><RecommendationCard rec={recs.primary} /></Card>
              <div className="flex flex-col gap-5">
                {recs.secondary && <Card><RecommendationCard rec={recs.secondary} /></Card>}
                {recs.resilientAlternative && (
                  <Card><RecommendationCard rec={recs.resilientAlternative} /></Card>
                )}
              </div>
            </div>
          ) : (
            <Card className="border-amber-200 bg-amber-50 p-6">
              <p className="font-medium text-amber-900">
                No crops are eligible under this combination of constraints.
              </p>
              <p className="mt-1 text-sm text-amber-700">Check the rejections below for the exact reasons.</p>
            </Card>
          )}

          {recs.rejected.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-1 font-semibold text-zinc-900">Why other crops were excluded</h3>
              <p className="mb-3 text-xs text-zinc-500">
                Hard-constraint violations from the deterministic engine ({recs.rejected.length} crops).
              </p>
              <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1 text-sm">
                {recs.rejected.map((r) => (
                  <li key={r.cropId} className="flex flex-wrap items-baseline gap-x-2 rounded-lg bg-zinc-50 px-3 py-1.5">
                    <span className="font-medium text-zinc-800">{cropName(r.cropId)}</span>
                    <span className="text-xs text-red-600">
                      {r.violations.map((v) => v.message).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <WhatIfSimulator
            context={{
              zoneId: form.zoneId,
              seasonId: form.seasonId,
              soilId: form.soilId,
              waterAvailability: form.waterAvailability,
            }}
            report={sim}
          />
        </>
      )}
    </div>
  );
}
