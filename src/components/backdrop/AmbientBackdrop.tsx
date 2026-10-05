/**
 * AmbientBackdrop — the fixed viewport cover under every surface (plan 4.2).
 *
 * Phase 7: the Dark Aurora layers were replaced with OpenSourceUI's
 * "Arc Bands Background" — sky/teal/amber/rose radial arcs rising from the
 * bottom edge over a warm cream base (#FFFCF7 → #FFF8F0), softened by two
 * blur passes and a faint 4px dot grid. Layer markup is copied verbatim
 * from:
 *
 *   https://opensourceui.in/components/arc-bands-background
 *   https://github.com/bidyut10
 *
 * --- MIT License -----------------------------------------------------------
 * Copyright (c) 2026 Bidyut Kundu
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * -------------------------------------------------------------------------
 *
 * Integration deltas vs the upstream component (which wraps `children`):
 * - wrapper here is the plan 4.2 fixed viewport cover, keeping `-z-10`,
 *   `pointer-events-none`, `aria-hidden` and the plan 4.6 `print:hidden`
 *   guard; the arc layers anchor to the viewport's bottom edge, so the
 *   glow rides along as the user scrolls.
 * - inner layers are untouched: static (one paint, zero runtime cost), so no
 *   reduced-motion handling is needed.
 */
export function AmbientBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#FFFCF7] print:hidden"
    >
      {/* Base vertical gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,#FFFCF7_0%,#FFF8F0_100%)]" />

      {/* Phase 7.6 — top-edge echo band (integration delta vs upstream).
          The Arc Bands rise from the BOTTOM edge, so the sticky header's
          pane sits over flat cream — and a refraction lens with nothing
          to bend renders as exactly the "plain glassmorphism" the user
          rejected. Two layers mirror the upstream pattern (sharp band +
          blur echo): a blurred sky→teal→amber dip for ambient colour,
          then a sharper arc whose edge crosses behind the bar's lower
          third — a crisp gradient edge is what a meniscus visibly KINKS,
          so the lens has something to bend even at page top. Static,
          one paint, same contract as every layer here. */}
      <div className="pointer-events-none absolute -top-[26%] left-1/2 -z-10 h-[52%] w-[160%] -translate-x-1/2 rounded-[100%] blur-2xl [background:radial-gradient(ellipse_120%_100%_at_50%_0%,rgba(56,189,248,0.20)_0%,rgba(45,212,191,0.15)_28%,rgba(245,158,11,0.10)_55%,transparent_80%)]" />
      <div className="pointer-events-none absolute -top-[16%] left-1/2 -z-10 h-[34%] w-[170%] -translate-x-1/2 rounded-[100%] [background:radial-gradient(ellipse_130%_100%_at_50%_0%,rgba(56,189,248,0.26)_0%,rgba(45,212,191,0.18)_45%,rgba(245,158,11,0.11)_70%,transparent_77%)]" />

      {/* Arc band — sky → teal → amber → rose radiating from the base */}
      <div className="pointer-events-none absolute -bottom-[28%] left-1/2 -z-10 h-[92%] w-[150%] -translate-x-1/2 rounded-[100%] [background:radial-gradient(ellipse_120%_88%_at_50%_100%,rgba(56,189,248,0.52)_0%,rgba(45,212,191,0.44)_18%,rgba(245,158,11,0.38)_40%,rgba(244,63,94,0.30)_62%,rgba(255,252,247,0)_82%)]" />

      {/* Softened echo of the band (blur-2xl) */}
      <div className="pointer-events-none absolute -bottom-[22%] left-1/2 -z-10 h-[78%] w-[128%] -translate-x-1/2 rounded-[100%] blur-2xl [background:radial-gradient(ellipse_110%_80%_at_50%_100%,rgba(56,189,248,0.28)_0%,rgba(45,212,191,0.24)_22%,rgba(251,191,36,0.20)_46%,rgba(251,113,133,0.16)_68%,transparent_86%)]" />

      {/* Inner white bloom lifting the very bottom (blur-3xl) */}
      <div className="pointer-events-none absolute -bottom-[18%] left-1/2 -z-10 h-[64%] w-[108%] -translate-x-1/2 rounded-[100%] blur-3xl [background:radial-gradient(ellipse_100%_72%_at_50%_100%,rgba(255,255,255,0.55)_0%,rgba(255,252,247,0.18)_38%,transparent_72%)]" />

      {/* Dot-grid texture */}
      <div className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(circle_at_center,#000_1px,transparent_1px)] [background-size:4px_4px] opacity-[0.03]" />
    </div>
  );
}
