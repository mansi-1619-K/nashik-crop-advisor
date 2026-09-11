import type { Metadata } from "next";
import { Cormorant_Garamond, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  weight: ["400", "700"],
  variable: "--font-cormorant",
  subsets: ["latin"],
});

const grotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const mono = Space_Mono({
  weight: ["400", "700"],
  variable: "--font-space-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nashik Crop Advisor — Field Decision-Support System",
  description:
    "Hyperlocal AI decision support for climate-aware crop planning in Nashik District, Maharashtra. Deterministic engine. Honest labels. Zero guesswork.",
};

const NAV = [
  { no: "01", label: "Input", href: "#input" },
  { no: "02", label: "Index", href: "#index" },
  { no: "03", label: "Contract", href: "#contract" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${grotesk.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="bg-paper">
          <div className="mx-auto w-full max-w-[1280px]">
            <div className="flex items-center justify-between gap-4 px-6 py-2 md:px-10">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">
                Field decision-support system · Nashik District, MH, IN
              </p>
              <p className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft sm:block">
                19.9975°N / 73.7898°E
              </p>
            </div>

            <div className="grid grid-cols-12 items-end gap-4 px-6 pb-5 pt-4 md:px-10">
              <a href="#top" className="col-span-12 lg:col-span-8">
                <h1 className="font-display text-[clamp(2.5rem,7vw,6.5rem)] font-light uppercase leading-[0.9] tracking-tight">
                  Nashik Crop
                  <br />
                  Advisor<span className="text-vermilion">.</span>
                </h1>
              </a>
              <aside className="col-span-12 flex flex-col gap-1 self-end lg:col-span-4 lg:items-end">
                <dl className="flex gap-6 font-mono text-[9px] uppercase tracking-[0.15em] text-ink-soft">
                  <div className="text-right">
                    <dt>Engine</dt>
                    <dd className="font-bold text-ink">v1.0.0</dd>
                  </div>
                  <div className="text-right">
                    <dt>Tests</dt>
                    <dd className="font-bold text-ink">162/162</dd>
                  </div>
                  <div className="text-right">
                    <dt>Keys</dt>
                    <dd className="font-bold text-ink">None</dd>
                  </div>
                </dl>
              </aside>
            </div>
          </div>

          <nav aria-label="Sections" className="border-t border-line">
            <ul className="mx-auto flex w-full max-w-[1280px]">
              {NAV.map((item, i) => (
                <li key={item.no} className="flex">
                  <a
                    href={item.href}
                    className="group flex items-center gap-2 px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft transition-colors duration-300 hover:text-ink md:px-10"
                  >
                    <span className="text-vermilion">{item.no}</span>
                    <span>{item.label}</span>
                    <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </a>
                  {i < NAV.length - 1 && (
                    <span aria-hidden className="self-center text-line">/</span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main id="top" className="mx-auto w-full max-w-[1280px] flex-1 px-6 md:px-10">
          {children}
        </main>

        <footer className="mt-20 bg-paper">
          <div className="mx-auto w-full max-w-[1280px] px-6 md:px-10">
            <div className="border-t border-line pt-10">
              <p
                aria-hidden
                className="font-display text-[clamp(2.5rem,9vw,9rem)] font-light uppercase leading-[0.85] tracking-tight text-line"
              >
                No oracle.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 border-t border-line py-8 font-mono text-[9px] uppercase leading-[1.8] tracking-[0.1em] text-ink-soft sm:grid-cols-3">
              <div>
                <p className="mb-2 font-bold text-ink">Provenance</p>
                <p>
                  Zone / crop / economic parameters are documented assumptions
                  pending validation against ICAR and MPKV references.
                </p>
              </div>
              <div>
                <p className="mb-2 font-bold text-ink">System</p>
                <p>
                  Engine v1.0.0 · 162 tests · evaluation harness with live-AI
                  measurement · works fully without API keys.
                </p>
              </div>
              <div>
                <p className="mb-2 font-bold text-ink">Colophon</p>
                <p>
                  Set in Cormorant Garamond, Space Grotesk &amp; Space Mono. Photographs:
                  Pexels License / Wikimedia Commons — CC BY-SA (see figure captions).
                </p>
              </div>
            </div>
            <p className="border-t border-line py-3 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">
              Decision support, not an oracle — it will never claim guaranteed
              yields, profits or disease detection.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
