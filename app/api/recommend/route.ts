import { NextResponse } from "next/server";
import { generateRecommendations, ENGINE_VERSION } from "@/lib/agriculture/recommend";
import { getWeather } from "@/lib/weather/cache";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { context, now } = (body ?? {}) as {
    context?: unknown;
    now?: string;
  };

  if (typeof context !== "object" || context === null) {
    return NextResponse.json(
      { error: "Missing required field: context.", engineVersion: ENGINE_VERSION },
      { status: 400 },
    );
  }

  let weatherAvailable = false;
  const talukaId = (context as { talukaId?: unknown }).talukaId;
  if (typeof talukaId === "string") {
    try {
      await getWeather(talukaId, { timeoutMs: 4000 });
      weatherAvailable = true;
    } catch {
      weatherAvailable = false;
    }
  }

  try {
    const output = generateRecommendations(context, {
      now: typeof now === "string" ? now : undefined,
      weatherAvailable,
    });
    return NextResponse.json({ ...output, weatherAvailable });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown engine error.";
    const isValidation = message.startsWith("Invalid farmer context");
    return NextResponse.json(
      { error: message, engineVersion: ENGINE_VERSION },
      { status: isValidation ? 400 : 500 },
    );
  }
}
