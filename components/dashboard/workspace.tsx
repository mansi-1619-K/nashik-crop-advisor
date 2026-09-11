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
    <div className="space-y-8">
      <Card label="Input parameters" index="Form-01">
        <ContextSelects form={form} onChange={setForm} disabled={loading} />

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink-soft">
            Preset scenarios:
          </span>
          {PRESET_DEMOS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setForm({ ...p.context, talukaId: p.context.talukaId ?? "" });
                void analyze(p.context as FormState);
              }}
              className="border border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft transition-all duration-300 hover:border-ink hover:text-ink"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={() => void analyze()}
            disabled={loading}
            className="group inline-flex items-center gap-2 border border-ink bg-ink px-6 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-paper transition-all duration-300 hover:bg-vermilion hover:border-vermilion disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <Play size={14} aria-hidden />
            )}
            {loading ? "Analyzing…" : "Analyze my farm"}
            <ArrowRight size={14} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          {recs && !loading && (
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-soft">
              engine v{recs.engineVersion} · deterministic output
            </span>
          )}
        </div>

        {error && (
          <p className="mt-4 border-l-2 border-alarm bg-paper-dim px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-alarm">
            ERROR — {error}
          </p>
        )}
      </Card>

      {!recs && !loading && (
        <div className="border border-dashed border-line bg-paper-dim p-12 text-center md:p-16">
          <Sprout size={24} aria-hidden className="mx-auto mb-4 text-ink-soft" />
          <p className="font-display text-3xl font-light uppercase leading-none md:text-5xl">
            Awaiting input<span className="text-vermilion">_</span>
          </p>
          <p className="mx-auto mt-4 max-w-md font-mono text-[10px] uppercase leading-[1.8] tracking-[0.1em] text-ink-soft">
            Configure your context and press &ldquo;analyze my farm&rdquo;. The deterministic
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
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <RecommendationCard rec={recs.primary} featured />
              <div className="flex flex-col gap-8">
                {recs.secondary && <RecommendationCard rec={recs.secondary} />}
                {recs.resilientAlternative && (
                  <RecommendationCard rec={recs.resilientAlternative} />
                )}
              </div>
            </div>
          ) : (
            <div className="border-l-2 border-caution bg-paper-dim p-6">
              <p className="font-display text-xl font-light uppercase md:text-2xl">
                Zero eligible crops.
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                No crop survives this combination of constraints. Check the
                rejections below for exact reasons.
              </p>
            </div>
          )}

          {recs.rejected.length > 0 && (
            <Card label="Exclusion ledger" index={`REJ-${String(recs.rejected.length).padStart(2, "0")}`}>
              <ul className="divide-y divide-line">
                {recs.rejected.map((r, i) => (
                  <li key={r.cropId} className="flex flex-wrap items-baseline gap-x-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="font-mono text-[10px] font-bold text-ink-soft">
                      X{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-bold uppercase">{cropName(r.cropId)}</span>
                    <span className="w-full font-mono text-[10px] leading-[1.6] tracking-[0.05em] text-alarm sm:w-auto">
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
