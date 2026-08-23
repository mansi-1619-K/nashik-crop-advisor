"use client";

import { useState } from "react";
import { Play, Loader2, Sprout, ArrowRight } from "lucide-react";
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
    <div className="space-y-6">
      <Card label="Input parameters" index="FORM-01">
        <ContextSelects form={form} onChange={setForm} disabled={loading} />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink-soft">
            Preset scenarios:
          </span>
          {PRESET_DEMOS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setForm({ ...p.context, talukaId: p.context.talukaId ?? "" });
                void analyze(p.context as FormState);
              }}
              className="border border-ink bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors duration-75 hover:bg-ink hover:text-paper"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => void analyze()}
            disabled={loading}
            className="group inline-flex items-center gap-2 border-2 border-ink bg-acid px-6 py-3 font-display text-sm uppercase tracking-wide transition-all duration-75 hover:bg-ink hover:text-acid disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <Play size={16} aria-hidden />
            )}
            {loading ? "Analyzing…" : "Analyze my farm"}
            <ArrowRight size={16} aria-hidden className="transition-transform duration-75 group-hover:translate-x-1" />
          </button>
          {recs && !loading && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
              engine v{recs.engineVersion} · deterministic output
            </span>
          )}
        </div>

        {error && (
          <p className="mt-3 border-l-8 border-alarm bg-white px-3 py-2 font-mono text-xs uppercase text-alarm">
            ERROR // {error}
          </p>
        )}
      </Card>

      {!recs && !loading && (
        <div className="dotgrid border-2 border-ink p-10 text-center md:p-14">
          <Sprout size={28} aria-hidden className="mx-auto mb-4" />
          <p className="font-display text-3xl uppercase leading-none md:text-5xl">
            Awaiting input<span className="text-acid-deep">_</span>
          </p>
          <p className="mx-auto mt-3 max-w-md font-mono text-xs uppercase leading-relaxed text-ink-soft">
            Configure your context and press “analyze my farm”. The deterministic
            engine ranks all 11 crops against hard constraints — no AI involved.
          </p>
        </div>
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecommendationCard rec={recs.primary} featured />
              <div className="flex flex-col gap-6">
                {recs.secondary && <RecommendationCard rec={recs.secondary} />}
                {recs.resilientAlternative && (
                  <RecommendationCard rec={recs.resilientAlternative} />
                )}
              </div>
            </div>
          ) : (
            <div className="border-l-8 border-caution bg-white p-5">
              <p className="font-display text-xl uppercase md:text-2xl">
                Zero eligible crops.
              </p>
              <p className="mt-1 font-mono text-xs uppercase text-ink-soft">
                No crop survives this combination of constraints. Check the
                rejections below for exact reasons.
              </p>
            </div>
          )}

          {recs.rejected.length > 0 && (
            <Card label="Exclusion ledger" index={`REJ-${String(recs.rejected.length).padStart(2, "0")}`}>
              <ul className="divide-y divide-line">
                {recs.rejected.map((r, i) => (
                  <li key={r.cropId} className="flex flex-wrap items-baseline gap-x-3 py-2 first:pt-0 last:pb-0">
                    <span className="font-mono text-xs font-bold text-ink-soft">
                      X{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-bold uppercase">{cropName(r.cropId)}</span>
                    <span className="w-full font-mono text-[11px] leading-relaxed text-alarm sm:w-auto">
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
