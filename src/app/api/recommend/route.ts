import { NextRequest, NextResponse } from "next/server";
import type {
  RecommendationRequest,
  RecommendationResponse,
} from "@/lib/types";
import { REGIONS, SEASONS, SOILS, WATER_LEVELS } from "@/lib/constants";
import { getFallbackRecommendations } from "@/lib/fallback-data";
import { normalizeGeminiCrops, queryGeminiCached } from "@/lib/gemini";

export const dynamic = "force-dynamic";

function validateRequest(body: unknown): body is RecommendationRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.region === "string" &&
    b.region in REGIONS &&
    typeof b.season === "string" &&
    b.season in SEASONS &&
    typeof b.soil === "string" &&
    b.soil in SOILS &&
    typeof b.water === "string" &&
    b.water in WATER_LEVELS
  );
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!validateRequest(payload)) {
    return NextResponse.json(
      {
        error: "Body must include valid region, season, soil and water values.",
      },
      { status: 400 },
    );
  }

  const requestData: RecommendationRequest = {
    region: payload.region,
    season: payload.season,
    soil: payload.soil,
    water: payload.water,
  };

  let crops;
  let source: "ai" | "fallback" = "fallback";

  try {
    const aiCrops = await queryGeminiCached(requestData);
    crops = normalizeGeminiCrops(aiCrops);
    source = "ai";
  } catch {
    crops = getFallbackRecommendations(requestData.region, requestData.season);
    source = "fallback";
  }

  const response: RecommendationResponse = {
    crops,
    source,
    generatedAt: new Date().toISOString(),
    request: requestData,
  };

  return NextResponse.json(response);
}
