import type { RecommendationOutput } from "@/lib/agriculture/results";
import type { WeatherSignal } from "@/lib/agriculture/weatherRisk";
import type { EvidenceBundle } from "./types";

/** Resolve model-emitted chunk ids against the bundle actually provided, dropping anything invented. */
export function resolveCitations(
  ids: string[] | undefined,
  bundle: EvidenceBundle,
): EvidenceBundle["citations"] {
  if (!ids || bundle.unavailable) return [];
  const known = new Map(bundle.chunks.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const out: EvidenceBundle["citations"] = [];
  for (const id of ids.map((i) => i.trim()).filter(Boolean)) {
    if (seen.has(id)) continue;
    seen.add(id);
    const chunk = known.get(id);
    if (!chunk) continue;
    out.push({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      title: chunk.title,
      organization: chunk.organization,
      credibility: chunk.credibility,
      sourceUrl: chunk.sourceUrl,
      sectionHeading: chunk.sectionHeading,
      updated: chunk.updated,
    });
    if (out.length >= 4) break;
  }
  return out;
}

/**
 * Build the advisory retrieval query from deterministic engine output only —
 * primary crop identity plus whatever risks/weather signals are in play.
 */
export function buildAdvisoryQuery(
  engine: RecommendationOutput,
  weatherSignals?: WeatherSignal[],
): string {
  const parts: string[] = [];
  if (engine.primary) {
    parts.push(engine.primary.cropId);
    for (const factor of engine.primary.suitability.factors
      .filter((f) => f.impact === "negative")
      .slice(0, 3)) {
      parts.push(factor.key);
    }
  }
  for (const warning of engine.primary?.warnings.slice(0, 3) ?? []) parts.push(warning);
  for (const signal of weatherSignals ?? []) parts.push(signal.type.replace(/-/g, " "));
  return parts.join(" ");
}
