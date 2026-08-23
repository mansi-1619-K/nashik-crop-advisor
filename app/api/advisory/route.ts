import { NextResponse } from "next/server";
import { narrateRecommendation } from "@/lib/ai/advisory";
import { runEngineForRequest } from "@/lib/ai/request-context";
import { buildAdvisoryQuery } from "@/lib/rag/evidence";
import { getEvidenceRetriever } from "@/lib/rag/retrieve";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const run = await runEngineForRequest(body);
  if (!run.ok) {
    return NextResponse.json({ error: run.error }, { status: run.status });
  }

  // Local deterministic retrieval over the reference handbook; degrades to no
  // evidence rather than failing the request.
  let evidence;
  try {
    evidence = getEvidenceRetriever().retrieve(buildAdvisoryQuery(run.engine, run.weatherSignals), {
      topK: 4,
    });
  } catch {
    evidence = undefined;
  }

  const advisory = await narrateRecommendation({
    engine: run.engine,
    contextSummary: run.contextSummary,
    weatherSignals: run.weatherSignals,
    weatherFreshness: run.weatherFreshness,
    evidence,
  });

  return NextResponse.json({
    advisory,
    engineVersion: run.engine.engineVersion,
    aiConfiguredNote:
      advisory.source === "static"
        ? "Set GEMINI_API_KEY server-side to enable AI narration. The deterministic output below is unaffected."
        : undefined,
  });
}
