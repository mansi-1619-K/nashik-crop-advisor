import type { GlassOptics } from "@samasante/liquid-glass";

/**
 * The two LOCKED optics presets (plan 4.3, reduced Phase 7). Phase 7
 * stripped liquid glass from every content surface (cards, banner,
 * modal) — only the small chrome shells keep a lens: the sticky header
 * bar (GlassBar → `GLASS_HEADER`, Phase 7.6 max-refraction pane) and the
 * pill/badge shells (GlassChip → `GLASS_CHROME`, quiet by design so five
 * pills don't shout). No ad-hoc `optics={{...}}` anywhere, so the
 * material stays consistent and the per-surface cost stays auditable.
 *
 * The look is REAL liquid glass, not glassmorphism: the body is near-CLEAR
 * (tint lives in each primitive's low-alpha `bg-*` class) and the lens
 * itself does the talking — the rim meniscus (`bend`) and the edge light
 * (`sheen`/`specular`/`glow`) are pushed up so the edges bend and light
 * up while the centre stays a flat, undistorted window. On the light
 * paper theme the glow reads as daylight caught in the material.
 *
 * `chrome` — soft 7px frost so content scrolling underneath mutes into a
 * backdrop, stronger rim bend and specular, full 512px map (six chrome
 * surfaces mount the lens: the header bar + the preset/action pills).
 *
 * Stays off the animation path: no `live`, no motion values — the
 * displacement map only re-rasters on resize. The map's APPLICATION is
 * the scroll cost, though: the compositor re-runs the `url()` pass for
 * every glass surface on every scroll frame (~110ms/frame measured in
 * Phase 7.5), so globals.css downgrades `.is-scrolling .glass-surface`
 * to a plain compositor blur and restores the full lens ~150ms after the
 * scroll settles. `mapSize` (not a call-site `filterResolution`, which
 * would eject us out of material mode — see the `isMaterial` gate in the
 * lib) stays the mount-cost lever.
 */
export const GLASS_CHROME: GlassOptics = {
  mapSize: 512,
  depth: 0.55,
  curvature: 0.4,
  dispersion: 0.35,
  strength: 0.055,
  clipToShape: true,
  softEdge: true,
  frost: 7,
  saturate: 1.22,
  brightness: 0.02,
  specular: 1,
  sheenAngle: 45,
  sheenDark: false,
  glow: 0.16,
  glowSpread: 1,
  glowFalloff: 0.5,
  sheen: 0.4,
  sheenWidth: 3,
  sheenFalloff: 1.5,
  splay: 0,
  bend: 0.5,
  bendWidth: 0.16,
};

/**
 * Phase 7.6 — the HEADER lens. The numbers are the user's own config
 * copied off the official demo (glass.samasante.com, "basic/pre
 * config") after their verdict on the chrome preset ("transparent, like
 * glassmorphism — I want real liquid glass there"): they want the top
 * bar to look like THAT, verbatim.
 *
 *   refraction  strength 0.14 · depth 0.95 · curvature 0.2
 *   edge        bend 1.4 · bendWidth 0.07
 *   sheen       intensity 1.2 · thickness 3.5 · specular 1.6
 *   background  glow 0.1 · frost 1 · brightness 0
 *
 * Fields they didn't list take the demo bundle's matching preset
 * (its `assets/index-*.js`): dispersion 0.2, splay 0, sheenAngle 0,
 * sheenFalloff 1.7, glowFalloff 0.6, glowSpread 1, clipToShape/softEdge
 * true. `saturate` is pinned to the material-mode default (1.15) the
 * demo inherits when its preset omits the field.
 *
 * Cost-driven tuning (Phase 7.7), all measured with the bar lensed
 * during scroll: `mapSize` stays at the demo's 512 (my earlier 1024
 * experiment cost +64ms/frame — the map primitive dominates the pass),
 * `dispersion` went to 0 (RGB-split passes: −17ms software / −4ms GPU
 * per frame, and the fringe was near-invisible anyway), and `bend` went
 * through a live 3-step user review — the pasted 1.4 (outside the
 * documented 0–1 range) read as "bends too much" at 0.9, still too much
 * at 0.45, and **0.25 was approved and locked at round 2**: a gentle rim
 * lip over an otherwise still-refracting pane. The magnified middle the
 * user wants comes from depth 0.95 + curvature 0.2.
 *
 * The result is a near-CRYSTAL pane (frost 1, brightness 0): a clear
 * window with a hard, bright, tight edge — not a frosted wash. It needs
 * backdrop structure to bend: AmbientBackdrop's top-edge echo band
 * exists for exactly this — over flat cream a perfect lens still looks
 * like nothing. `bg-canvas/30` on GlassBar is the only tint left.
 *
 * Perf: at rest nothing invalidates the filter (metal parked, sparks
 * parked). Since Phase 7.7 the bar is EXEMPT from the `.is-scrolling`
 * downgrade — the user rejected the visible lens→blur→lens pop on the
 * top bar ("don't remove liq glass, I want it there all the time") — so
 * this lens runs at every moment; only the chips still swap to plain
 * blur while the page moves. Final measured with the lens on at all
 * times: hardware GL (ANGLE, Radeon 740M) idle 16.6 / scroll 17.0 avg,
 * p95 17 — locked 60fps; software-raster fallback 35ms (worst case,
 * GPU-less browsers only). Scripts: perf-probe / perf-probe-gpu.
 */
export const GLASS_HEADER: GlassOptics = {
  mapSize: 512,
  depth: 0.95,
  curvature: 0.2,
  dispersion: 0,
  strength: 0.14,
  clipToShape: true,
  softEdge: true,
  frost: 1,
  saturate: 1.15,
  brightness: 0,
  specular: 1.6,
  sheenAngle: 0,
  sheenDark: false,
  glow: 0.1,
  glowSpread: 1,
  glowFalloff: 0.6,
  sheen: 1.2,
  sheenWidth: 3.5,
  sheenFalloff: 1.7,
  splay: 0,
  bend: 0.25,
  bendWidth: 0.07,
};

/** Marker class every glass wrapper carries: `@media print` suppression and
 *  the `prefers-reduced-motion` guard in globals.css key off this. */
export const GLASS_SURFACE = "glass-surface";

/** Extra marker on GlassBar ONLY — exempts the top bar from the
 *  `.is-scrolling` lens downgrade in globals.css. The user rejected the
 *  visible lens→blur→lens pop on the header ("when I stop the scroll it
 *  glitches back"), so the bar keeps its liquid glass at every moment;
 *  only the small chips swap to plain blur while the page moves. */
export const GLASS_BAR = "glass-bar";
