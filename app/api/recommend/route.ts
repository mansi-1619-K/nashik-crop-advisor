import { NextResponse } from "next/server";
import { generateRecommendations, ENGINE_VERSION } from "@/lib/agriculture/recommend";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  try {
    const output = generateRecommendations(body);
    return NextResponse.json(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown engine error.";
    const isValidation = message.startsWith("Invalid farmer context");
    return NextResponse.json(
      { error: message, engineVersion: ENGINE_VERSION },
      { status: isValidation ? 400 : 500 },
    );
  }
}
