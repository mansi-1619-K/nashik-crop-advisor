import Image from "next/image";
import { Workspace } from "@/components/dashboard/workspace";
import { SecHeader } from "@/components/ui/section-header";
import { IndexEntry } from "@/components/dashboard/section-placeholder";
import { DataSourceBadge } from "@/components/ui/badge";
import assetsManifest from "../public/assets/raw/manifest.json";

const SOURCE_CONTRACT = [
  { cls: "live" as const, meaning: "Fetched this request from the named upstream (Open-Meteo)." },
  { cls: "static" as const, meaning: "Deterministic fallback content built from engine output." },
  { cls: "estimated" as const, meaning: "Range computed from assumed dataset parameters." },
  { cls: "heuristic" as const, meaning: "Rule-based advisory signal. Never a diagnosis." },
  { cls: "ai_generated" as const, meaning: "Gemini narration constrained to engine data and cited evidence." },
  { cls: "user_provided" as const, meaning: "Typed or selected by you in the form." },
];

const INDEX = [
  {
    no: "01",
    title: "Deterministic core",
    description:
      "Hard agronomic constraints feed a seven-factor suitability score. One violation rejects a crop outright. Monsoon substitution is explicit, never silent.",
    stat: "11 crops ranked · 0/49 expectation failures",
    wide: true,
  },
  {
    no: "02",
    title: "Weather intelligence",
    description: "Open-Meteo forecasts translated into heuristic field signals.",
    stat: "LIVE → CACHED → STALE",
    wide: false,
  },
  {
    no: "03",
    title: "Economics engine",
    description: "Per-acre cost, yield and price ranges with source classes.",
    stat: "ESTIMATED / SAMPLE",
    wide: false,
  },
  {
    no: "04",
    title: "RAG citations",
    description:
      "A local reference handbook is chunked and retrieved lexically. Models may cite only passages actually supplied.",
    stat: "R@3 1.0 · MRR 1.0 · hallucinations dropped",
    wide: false,
  },
  {
    no: "05",
    title: "AI narration",
    description:
      "Gemini narrates engine snapshots through a retry ladder with schema validation.",
    stat: "Fallback rate 0 · first-attempt validity 1.0",
    wide: false,
  },
  {
    no: "06",
    title: "Evaluation harness",
    description:
      "Scenario benchmarks, stability perturbations, retrieval scoring and live-AI audits — reproducible via one command.",
    stat: "162 tests · npm run evaluate",
    wide: false,
  },
];

const figures = assetsManifest.images.map((img, i) => ({
  src: img.file,
  alt: `${img.title.replace(/^File:|\.[a-z]+$/g, "")} — agriculture reference`,
  width: img.width,
  height: img.height,
  license: img.license,
  credit: img.artist || "Wikimedia Commons",
  fig: String(i + 1).padStart(2, "0"),
}));

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* notice strip */}
      <div className="mb-10 border-l-2 border-vermilion bg-paper-dim px-5 py-3 md:px-8">
        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-soft md:text-[10px]">
          <span className="font-bold text-vermilion">Notice</span>{" "}
          Decision-support prototype — deterministic engine over documented
          assumptions. Economics are estimates. Weather is live from Open-Meteo.
          Not agronomic advice.
        </p>
      </div>

      {/* hero */}
      <section className="grid grid-cols-12 gap-8 pb-16 pt-4 md:pt-8">
        <div className="col-span-12 lg:col-span-8">
          <h2 className="font-display text-[clamp(2.75rem,9vw,7.5rem)] font-light uppercase leading-[0.88] tracking-tight">
            Raw data<span className="text-vermilion">.</span> Hard limits
            <span className="text-vermilion">.</span>
            <br />
            No guesswork<span className="text-vermilion">.</span>
          </h2>
          <div className="mt-8 flex gap-6">
            <div className="accent-bar shrink-0 self-stretch" />
            <p className="max-w-xl text-base leading-[1.7] text-ink-soft md:text-lg">
              A deterministic engine ranks eleven crops against hard agronomic
              constraints for your zone, season, soil and water. Weather signals
              are heuristic. AI narrates the results —{" "}
              <strong className="text-ink">it never decides</strong>.
            </p>
          </div>
        </div>
        <aside className="col-span-12 self-end lg:col-span-4">
          <dl className="divide-y divide-line border-t border-b border-line font-mono text-[9px] uppercase leading-[2] tracking-[0.12em]">
            {[
              ["Status", "Operational"],
              ["Datasets", "6 validated"],
              ["Knowledge docs", "14 chunked"],
              ["Last evaluation", "2026-08-23"],
              ["API keys required", "None"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 px-1 py-1.5">
                <dt className="text-ink-soft">{k}</dt>
                <dd className="font-bold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      {/* agriculture figure band */}
      <section aria-label="Agriculture references" className="border-y border-line">
        <p className="border-b border-line px-1 pt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">
          Nashik agriculture — vineyards, orchards, crop fields · Pexels / Wikimedia Commons
        </p>
        <ul className="flex snap-x snap-mandatory gap-0 overflow-x-auto">
          {figures.map((f, i) => (
            <li key={f.fig} className="w-[280px] shrink-0 snap-start md:w-[380px]">
              <figure>
                <Image
                  src={f.src}
                  alt={f.alt}
                  width={f.width}
                  height={f.height}
                  sizes="(max-width: 768px) 280px, 380px"
                  className="h-52 w-full object-cover contrast-[1.05] brightness-[0.98] md:h-72"
                  {...(i === 0 ? { priority: true } : { loading: "lazy" })}
                />
                <figcaption className="flex items-baseline justify-between gap-2 border-t border-line px-2 py-1.5 font-mono text-[8px] uppercase tracking-[0.15em] text-ink-soft">
                  <span>
                    <span className="font-bold text-ink">Fig. {f.fig}</span>{" "}
                    {f.alt.split(" — ")[0]}
                  </span>
                  <span className="shrink-0">{f.license}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      {/* SEC.01 — the working tool */}
      <section id="input" className="scroll-mt-24 pt-16">
        <SecHeader no="01" title="Field Input & Analysis" meta="Form-01 / Engine v1.0.0" />
        <Workspace />
      </section>

      {/* SEC.02 — system index */}
      <section id="index" className="scroll-mt-24 pt-20">
        <SecHeader no="02" title="System Index" meta="Six subsystems / all measured" />
        <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {INDEX.map((entry) => (
            <IndexEntry key={entry.no} {...entry} />
          ))}
        </div>
      </section>

      {/* SEC.03 — honesty contract */}
      <section id="contract" className="scroll-mt-24 pt-20 pb-16">
        <SecHeader no="03" title="Data Honesty Contract" meta="Every value carries exactly one label" />
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line font-mono text-[9px] uppercase tracking-[0.15em] text-ink-soft">
                <th className="px-4 py-2.5 font-normal">Label</th>
                <th className="px-4 py-2.5 font-normal">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {SOURCE_CONTRACT.map((row) => (
                <tr key={row.cls} className="border-b border-line last:border-b-0">
                  <td className="w-[170px] px-4 py-2.5 align-top">
                    <DataSourceBadge valueClass={row.cls} />
                  </td>
                  <td className="px-4 py-2.5 align-top text-ink-soft">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl font-mono text-[10px] uppercase leading-[1.8] tracking-[0.1em] text-ink-soft">
          This is decision support, not an oracle. It will never claim guaranteed
          yields, profits or disease detection.
        </p>
      </section>
    </div>
  );
}
