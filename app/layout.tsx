import type { Metadata } from "next";
import { Anton, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
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
  { no: "01", label: "INPUT", href: "#input" },
  { no: "02", label: "INDEX", href: "#index" },
  { no: "03", label: "CONTRACT", href: "#contract" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${grotesk.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b-2 border-ink bg-paper">
          <div className="mx-auto w-full max-w-[1400px]">
            <div className="flex items-center justify-between gap-4 border-b border-ink px-4 py-1.5 md:px-8">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
                Field decision-support system // Nashik District, MH, IN
              </p>
              <p className="hidden font-mono text-[10px] uppercase tracking-widest text-ink-soft sm:block">
                19.9975°N / 73.7898°E
              </p>
            </div>

            <div className="grid grid-cols-12 items-end gap-4 px-4 pb-4 pt-6 md:px-8">
              <a href="#top" className="col-span-12 lg:col-span-9">
                <h1 className="font-display text-[clamp(2.75rem,8vw,7rem)] uppercase leading-[0.88] tracking-tight">
                  Nashik Crop
                  <br />
                  Advisor<span className="text-acid-deep">.</span>
                </h1>
              </a>
              <dl className="col-span-12 grid grid-cols-3 border-2 border-ink font-mono text-[10px] uppercase leading-relaxed lg:col-span-3">
                <div className="border-r border-ink p-2">
                  <dt className="text-ink-soft">Engine</dt>
                  <dd className="font-bold">v1.0.0</dd>
                </div>
                <div className="border-r border-ink p-2">
                  <dt className="text-ink-soft">Tests</dt>
                  <dd className="font-bold">162/162</dd>
                </div>
                <div className="bg-acid p-2">
                  <dt className="text-ink-soft">Keyless</dt>
                  <dd className="font-bold">OK</dd>
                </div>
              </dl>
            </div>
          </div>

          <nav aria-label="Sections" className="border-t-2 border-ink bg-paper">
            <ul className="mx-auto grid w-full max-w-[1400px] grid-cols-3 divide-x-2 divide-ink font-mono text-xs uppercase md:text-sm">
              {NAV.map((item) => (
                <li key={item.no} className="flex">
                  <a
                    href={item.href}
                    className="flex w-full items-center justify-center gap-2 px-3 py-2 transition-colors duration-75 hover:bg-ink hover:text-paper md:justify-start md:px-8"
                  >
                    <span className="text-acid-deep">[{item.no}]</span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <main id="top" className="mx-auto w-full max-w-[1400px] flex-1 px-4 md:px-8">
          {children}
        </main>

        <footer className="mt-16 border-t-2 border-ink bg-paper">
          <div className="mx-auto w-full max-w-[1400px] px-4 md:px-8">
            <p
              aria-hidden
              className="text-stroke select-none pt-8 font-display text-[clamp(3rem,11vw,11rem)] uppercase leading-none"
            >
              No oracle.
            </p>
            <div className="grid grid-cols-1 gap-6 border-t-2 border-ink py-6 font-mono text-[10px] uppercase leading-relaxed text-ink-soft sm:grid-cols-3">
              <div>
                <p className="mb-1 font-bold text-ink">Provenance</p>
                <p>
                  Zone / crop / economic parameters are documented assumptions
                  pending validation against ICAR and MPKV references.
                </p>
              </div>
              <div>
                <p className="mb-1 font-bold text-ink">System</p>
                <p>
                  Engine v1.0.0 · 162 tests · evaluation harness with live-AI
                  measurement · works fully without API keys.
                </p>
              </div>
              <div>
                <p className="mb-1 font-bold text-ink">Colophon</p>
                <p>
                  Set in Anton, Space Grotesk &amp; Space Mono. Photographs:
                  Wikimedia Commons — CC0 / Public domain (see figure captions).
                </p>
              </div>
            </div>
            <p className="border-t border-line py-2 font-mono text-[10px] uppercase text-ink-soft">
              Decision support, not an oracle — it will never claim guaranteed
              yields, profits or disease detection.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
