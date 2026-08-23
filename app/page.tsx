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
  alt: `${img.title.replace(/^File:|\.[a-z]+$/g, "")} — raw concrete reference`,
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
      <div className="border-x-2 border-b-2 border-ink bg-ink px-4 py-2 md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-paper md:text-xs">
          <span className="bg-alarm px-1 font-bold">Notice</span>{" "}
          Decision-support prototype — deterministic engine over documented
          assumptions. Economics are estimates. Weather is live from Open-Meteo.
          Not agronomic advice.
        </p>
      </div>

      {/* hero */}
      <section className="grid grid-cols-12 gap-6 pb-10 pt-8 md:pt-12">
        <div className="col-span-12 lg:col-span-9">
          <h2 className="font-display text-[clamp(3rem,10vw,8.25rem)] uppercase leading-[0.88] tracking-tight">
            Raw data<span className="text-acid-deep">.</span> Hard limits
            <span className="text-acid-deep">.</span>
            <br />
            No guesswork<span className="text-acid-deep">.</span>
          </h2>
          <p className="mt-6 max-w-2xl border-l-4 border-ink pl-4 text-base leading-relaxed text-ink-soft md:text-lg">
            A deterministic engine ranks eleven crops against hard agronomic
            constraints for your zone, season, soil and water. Weather signals
            are heuristic. AI narrates the results —{" "}
            <strong className="text-ink">it never decides</strong>.
          </p>
        </div>
        <aside className="col-span-12 self-end lg:col-span-3">
          <dl className="divide-y divide-ink border-2 border-ink bg-white font-mono text-[10px] uppercase leading-relaxed">
            {[
              ["Status", "Operational"],
              ["Datasets", "6 validated"],
              ["Knowledge docs", "14 chunked"],
              ["Last evaluation", "2026-08-23"],
              ["API keys required", "None"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 px-2.5 py-1.5">
                <dt className="text-ink-soft">{k}</dt>
                <dd className="font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      {/* concrete figure band */}
      <section aria-label="Reference textures" className="border-y-2 border-ink">
        <p className="border-b border-line px-1 pt-3 font-mono text-[10px] uppercase tracking-widest text-ink-soft">
          Reference texture — raw concrete / raw data · Wikimedia Commons · CC0
          or Public domain
        </p>
        <ul className="flex snap-x snap-mandatory gap-0 overflow-x-auto divide-x-2 divide-ink">
          {figures.map((f) => (
            <li key={f.fig} className="w-[300px] shrink-0 snap-start md:w-[420px]">
              <figure>
                <Image
                  src={f.src}
                  alt={f.alt}
                  width={f.width}
                  height={f.height}
                  sizes="(max-width: 768px) 300px, 420px"
                  className="h-56 w-full object-cover grayscale contrast-125 md:h-80"
                />
                <figcaption className="flex items-baseline justify-between gap-2 border-t-2 border-ink px-2 py-1 font-mono text-[9px] uppercase leading-snug text-ink-soft">
                  <span>
                    <span className="font-bold text-ink">FIG.{f.fig}</span>{" "}
                    {f.alt.split(" — ")[0]}
                  </span>
                  <span>{f.license}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      {/* SEC.01 — the working tool */}
      <section id="input" className="scroll-mt-24 pt-12">
        <SecHeader no="01" title="Field Input & Analysis" meta="Form-01 / Engine v1.0.0" />
        <Workspace />
      </section>

      {/* SEC.02 — system index */}
      <section id="index" className="scroll-mt-24 pt-16">
        <SecHeader no="02" title="System Index" meta="Six subsystems / all measured" />
        <div className="grid grid-cols-1 gap-px border-2 border-ink bg-ink md:grid-cols-2 lg:grid-cols-3">
          {INDEX.map((entry) => (
            <IndexEntry key={entry.no} {...entry} />
          ))}
        </div>
      </section>

      {/* SEC.03 — honesty contract */}
      <section id="contract" className="scroll-mt-24 pt-16">
        <SecHeader no="03" title="Data Honesty Contract" meta="Every value carries exactly one label" />
        <div className="overflow-x-auto border-2 border-ink bg-white">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-ink font-mono text-[10px] uppercase tracking-widest text-ink-soft">
                <th className="px-3 py-2 font-normal">Label</th>
                <th className="px-3 py-2 font-normal">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {SOURCE_CONTRACT.map((row) => (
                <tr key={row.cls} className="border-b border-line last:border-b-0">
                  <td className="w-[170px] px-3 py-2 align-top">
                    <DataSourceBadge valueClass={row.cls} />
                  </td>
                  <td className="px-3 py-2 align-top text-ink-soft">{row.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-3xl font-mono text-xs uppercase leading-relaxed text-ink-soft">
          This is decision support, not an oracle. It will never claim guaranteed
          yields, profits or disease detection.
        </p>
      </section>
    </div>
  );
}
