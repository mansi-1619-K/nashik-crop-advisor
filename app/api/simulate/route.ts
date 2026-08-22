import { NextResponse } from "next/server";
import { runSensitivity, type SensitivityScenario } from "@/lib/agriculture/sensitivity";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { context, scenarios } = (body ?? {}) as {
    context?: unknown;
    scenarios?: SensitivityScenario[];
  };

  if (!context) {
    return NextResponse.json(
      { error: "Missing required field: context.", available: false },
      { status: 400 },
    );
  }

  try {
    const report = runSensitivity(context, {
      scenarios: Array.isArray(scenarios) ? scenarios : undefined,
    });
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown simulation error.";
    const isValidation = message.startsWith("Invalid farmer context");
    return NextResponse.json({ error: message }, { status: isValidation ? 400 : 500 });
  }
}
