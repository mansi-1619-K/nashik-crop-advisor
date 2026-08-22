import { NextResponse } from "next/server";
import { answerFarmQuestion, sanitizeQuestion } from "@/lib/ai/chat";
import { runEngineForRequest, sanitizeHistory } from "@/lib/ai/request-context";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const question = sanitizeQuestion((body as { question?: unknown })?.question);
  if (!question) {
    return NextResponse.json(
      { error: "Provide a non-empty question (max 500 characters)." },
      { status: 400 },
    );
  }

  const run = await runEngineForRequest(body);
  if (!run.ok) {
    return NextResponse.json({ error: run.error }, { status: run.status });
  }

  const history = sanitizeHistory((body as { history?: unknown }).history);

  const result = await answerFarmQuestion({
    question,
    history,
    engine: run.engine,
    contextSummary: run.contextSummary,
    weatherSignals: run.weatherSignals,
  });

  return NextResponse.json({ ...result, question });
}
