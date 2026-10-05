"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, FlaskConical, Sparkles, Trophy } from "lucide-react";
import { useRecommendation } from "@/hooks/useRecommendation";
import type { CropTier } from "@/lib/types";
import { REGIONS } from "@/lib/constants";
import { DURATION, EASE_STANDARD } from "@/lib/motion";
import { Header } from "./Header";
import { PresetButtons } from "./PresetButtons";
import { ParameterPanel } from "./ParameterPanel";
import { WeatherWidget } from "./WeatherWidget";
import { CropSwitcher } from "./CropSwitcher";
import { CropDetails } from "./CropDetails";
import { ComparisonView } from "./ComparisonView";
import { ExportButton } from "./ExportButton";
import { PrintSummary } from "./PrintSummary";
import { FadeIn, SectionCard } from "./ui";
import { Tabs, TabsContent } from "./ui/tabs";
import { RecommendationLoader } from "./RecommendationLoader";
import { GlassChip } from "./glass/GlassChip";
import { InteractiveHoverButton } from "./block/interactive-hover-button";
import { HoverImg } from "./block/hover-img";
import { cropImage } from "@/lib/crop-images";

export function Dashboard() {
  const {
    params,
    recommendation,
    weather,
    loadingRecommendation,
    loadingWeather,
    error,
    setParam,
    setParams,
    retry,
  } = useRecommendation();

  const [activeTier, setActiveTier] = useState<CropTier>("primary");
  const [compareOpen, setCompareOpen] = useState(false);

  /* `?? []` would allocate a fresh array per render and re-trigger the
     gallery memo below; memoizing the source keeps the identity stable. */
  const crops = useMemo(() => recommendation?.crops ?? [], [recommendation]);
  const activeCrop = crops.find((c) => c.tier === activeTier) ?? crops[0];

  /* Plan 5.4 — photo index for the hover-img gallery. Memoized so the
     block's pointer listeners aren't re-bound on every Dashboard render
     (weather/params state changes nothing about the ranking). */
  const galleryProjects = useMemo(
    () =>
      crops.map((crop) => ({
        title: crop.crop,
        label: crop.tag,
        imageSrc: cropImage(crop.crop),
      })),
    [crops],
  );

  return (
    <main className="pb-20 print:p-0">
      <PrintSummary
        params={params}
        crops={crops}
        generatedAt={recommendation?.generatedAt ?? ""}
        source={recommendation?.source ?? "fallback"}
      />

      <Header params={params} weather={weather} />

      <div className="mx-auto max-w-7xl space-y-7 px-5 py-8 sm:px-6 print:p-0">
        {error ? (
          /* Terracotta-tinted error banner (Phase 7: solid — glass now
             lives only in the small chrome shells). */
          <div className="print-hide rounded-lg border border-terracotta/25 bg-terracotta-light shadow-1">
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle
                  className="mt-0.5 h-5 w-5 shrink-0 text-terracotta"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    A network error occurred
                  </p>
                  <p className="mt-0.5 text-xs text-ink-secondary">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={retry}
                className="shrink-0 rounded-sm border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-secondary transition-all hover:border-moss/30 hover:bg-moss-light hover:text-moss-deep"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}

        <FadeIn delay={0.05}>
          <PresetButtons params={params} onApply={setParams} />
        </FadeIn>

        {/* items-start: with solid paper cards, a stretched short card reads
            as empty box (the glass version hid it behind the aurora) — the
            weather card now sizes to its content next to the taller panel. */}
        <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-[400px_1fr]">
          <FadeIn delay={0.1}>
            <div className="space-y-7">
              <ParameterPanel params={params} onChange={setParam} />
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <WeatherWidget
              region={params.region}
              weather={weather}
              loading={loadingWeather}
              onRefresh={retry}
            />
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <SectionCard className="overflow-hidden print-break">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-canvas-warm/50 px-6 py-5">
              {/* Single hierarchy: display heading → muted subhead (icon inline). */}
              <div className="flex items-center gap-2.5">
                <span className="text-moss" aria-hidden>
                  <Trophy className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-h3 font-bold text-ink">
                    Crop Recommendations
                  </h2>
                  <p className="text-xs text-ink-muted">
                    {REGIONS[params.region].name} ·{" "}
                    {recommendation
                      ? `${crops.length} ranked options · ${
                          recommendation.source === "ai"
                            ? "Gemini AI engine"
                            : "Scientific dataset"
                        }`
                      : "Ranked for your field parameters"}
                  </p>
                </div>
              </div>
              {/* Floating action bar (plan 4.4): glass pill holding the
                  source badge, Compare and Export. */}
              <GlassChip className="rounded-full p-1 print-hide">
                <div className="flex items-center gap-2">
                  {recommendation?.source === "ai" ? (
                    <span className="flex items-center gap-1 rounded-full bg-moss-light px-2.5 py-1 text-[11px] font-semibold text-moss-deep ring-1 ring-inset ring-moss/10">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      AI generated
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-sage-light px-2.5 py-1 text-[11px] font-semibold text-olive ring-1 ring-inset ring-sage/10">
                      <FlaskConical className="h-3 w-3" aria-hidden />
                      Offline fallback
                    </span>
                  )}
                  {recommendation && crops.length >= 2 ? (
                    <InteractiveHoverButton
                      type="button"
                      onClick={() => setCompareOpen(true)}
                      className="px-4 py-2.5 text-sm"
                    >
                      Compare all ({crops.length})
                    </InteractiveHoverButton>
                  ) : null}
                  <ExportButton />
                </div>
              </GlassChip>
            </div>

            <div className="space-y-6 p-6">
              {loadingRecommendation ? (
                <RecommendationLoader />
              ) : activeCrop ? (
                <>
                  {/* Plan 5.4 — hover-img: photo index of the ranked crops,
                      hovering a row floats that crop's photo on the cursor.
                      The rows duplicate content already reachable via the
                      tabs and panel, so the gallery is hidden from AT and
                      from print (paper uses PrintSummary). */}
                  <div aria-hidden="true" className="print:hidden">
                    <HoverImg projects={galleryProjects} compact />
                  </div>
                  {/* Tabs root: CropSwitcher renders the tab list, CropDetails is
                      the tab panel. Value tracks activeCrop so a stale tier after
                      a recompute still maps to a real trigger. */}
                  <Tabs
                    value={activeCrop.tier}
                    onValueChange={(v) => setActiveTier(v as CropTier)}
                    className="gap-6"
                  >
                    <CropSwitcher crops={crops} activeTier={activeCrop.tier} />
                    <TabsContent value={activeCrop.tier} className="mt-0">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeCrop.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: DURATION.base,
                            ease: EASE_STANDARD,
                          }}
                        >
                          <CropDetails
                            crop={activeCrop}
                            activeTier={activeCrop.tier}
                          />
                        </motion.div>
                      </AnimatePresence>
                    </TabsContent>
                  </Tabs>
                </>
              ) : null}
            </div>
          </SectionCard>
        </FadeIn>
      </div>

      <ComparisonView
        crops={crops}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      />
    </main>
  );
}
