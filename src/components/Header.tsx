import {
  Droplets,
  Leaf,
  MapPin,
  Sprout,
  ThermometerSun,
  Wind,
} from "lucide-react";
import type { RecommendationRequest, WeatherResponse } from "@/lib/types";
import { REGIONS, SEASONS } from "@/lib/constants";
import { GlassBar } from "./glass/GlassBar";
import { FlipText } from "./block/flip-text";
import { LiquidMetal } from "./block/liquid-metal";

export function Header({
  params,
  weather,
}: {
  params: RecommendationRequest;
  weather: WeatherResponse | null;
}) {
  const region = REGIONS[params.region];
  const season = SEASONS[params.season];

  return (
    /* Chrome bar (plan 4.4): sticky from lg up (mobile header is tall —
       sticky would eat the viewport), z-40 keeps it under dialogs (z-50). */
    <header className="z-40 print-hide lg:sticky lg:top-0">
      <GlassBar className="border-0 border-b border-b-border/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Single hierarchy: display heading → muted subhead (brand icon inline). */}
          <div className="flex items-start gap-3">
            {/* Plan 5.5 — liquid-metal logo chip: liquid gold chrome with
                the sprout mark set in a dark medallion disc (moss-light is
                near-black after the Phase 1.4 token flip, and bright bands
                would swallow a naked light glyph — the disc makes contrast
                deterministic while the metal reads as a bezel). bg-surface +
                ring are the no-WebGL fallback; the header is already
                print-hidden, and the shader parks itself under
                prefers-reduced-motion (the live matchMedia hook — motion's
                own useReducedMotion only reads the mount-time value). */}
            <span
              className="relative mt-0.5 inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface ring-1 ring-inset ring-border/60"
              aria-hidden
            >
              <LiquidMetal
                colorBack="#191c13"
                colorTint="#dfbd7e"
                /* Phase 7.5 — speed 0 parks the shader's rAF entirely
                   (shader-mount: "If set to 0, rAF will stop entirely so
                   static shaders have no recurring performance costs") —
                   the chip keeps its static liquid-gold frame, but the
                   per-frame canvas repaint no longer wakes the glass
                   bar's backdrop-filter behind it (measured: that
                   repaint chain was holding the page at ≈11fps while
                   idle). Re-enable with a nonzero speed only if the
                   idle frame budget allows it. */
                speed={0}
                repetition={3}
                distortion={0.15}
                scale={1.4}
                className="rounded-md"
              />
              <span className="relative z-10 flex size-7 items-center justify-center rounded-full bg-surface/85 ring-1 ring-white/10">
                <Sprout className="h-4 w-4 text-moss-deep" />
              </span>
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1
                  className="font-display text-h2 font-bold text-ink"
                  aria-label="Nashik Crop Advisor"
                >
                  {/* Plan 5.3 — one-shot flip wave on load. loop=false so the
                      brand heading settles instead of pulsing forever;
                      aria-label keeps the heading's accessible name intact
                      (the text is fragmented into per-char spans). */}
                  <FlipText
                    duration={1.4}
                    delay={0.1}
                    loop={false}
                    className="leading-[1.25]"
                  >
                    Nashik Crop Advisor
                  </FlipText>
                </h1>
                <span className="rounded-full bg-moss-light px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-moss-deep ring-1 ring-inset ring-moss/10">
                  District Agro-Advisory
                </span>
              </div>
              <p className="mt-0.5 text-sm text-ink-muted">
                Hyper-local crop science, weather & farm economics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2.5 rounded-md border border-border/50 bg-surface/60 px-3.5 py-2.5">
              <MapPin className="h-4 w-4 text-moss" aria-hidden />
              <div className="text-xs">
                <p className="font-semibold text-ink">{region.shortName}</p>
                <p className="text-ink-secondary">{region.tehsils}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-md border border-border/50 bg-surface/60 px-3.5 py-2.5">
              <Leaf className="h-4 w-4 text-moss" aria-hidden />
              <div className="text-xs">
                <p className="font-semibold text-ink">{season.name} season</p>
                <p className="text-ink-secondary">{season.window}</p>
              </div>
            </div>

            {/* Labels use `ink-secondary` (not muted): since 7.6 the header
                glass is near-crystal (frost 1), so these cards composite the
                top band nearly unblurred — muted ink measured 3.63:1 there
                (AA fail), secondary clears 4.5:1. */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-md border border-border/50 bg-surface/60 px-3 py-2 text-center">
                <ThermometerSun
                  className="mx-auto mb-1 h-4 w-4 text-terracotta"
                  aria-hidden
                />
                <p className="text-sm font-bold text-ink">
                  {weather
                    ? `${Math.round(weather.current.temperature)}°`
                    : "—"}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-ink-secondary">
                  Now
                </p>
              </div>
              <div className="rounded-md border border-border/50 bg-surface/60 px-3 py-2 text-center">
                <Droplets
                  className="mx-auto mb-1 h-4 w-4 text-sage"
                  aria-hidden
                />
                <p className="text-sm font-bold text-ink">
                  {weather ? `${Math.round(weather.current.humidity)}%` : "—"}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-ink-secondary">
                  Humidity
                </p>
              </div>
              <div className="rounded-md border border-border/50 bg-surface/60 px-3 py-2 text-center">
                <Wind
                  className="mx-auto mb-1 h-4 w-4 text-ink-muted"
                  aria-hidden
                />
                <p className="text-sm font-bold text-ink">
                  {weather ? `${Math.round(weather.current.windSpeed)}` : "—"}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-ink-secondary">
                  km/h
                </p>
              </div>
            </div>
          </div>
        </div>
      </GlassBar>
    </header>
  );
}
