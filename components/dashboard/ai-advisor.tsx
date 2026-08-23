"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdvisoryResult } from "@/lib/ai/advisory";
import type { ChatResult } from "@/lib/ai/chat";
import type { Citation } from "@/lib/rag/types";

export interface AdvisorContext {
  zoneId: string;
  seasonId: string;
  soilId: string;
  waterAvailability: string;
  talukaId?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  source?: ChatResult["source"];
  caveats?: string[];
  citations?: Citation[];
}

const SOURCE_BADGE = {
  ai_generated: { variant: "success" as const, label: "AI-GENERATED" },
  static: { variant: "warning" as const, label: "STATIC FALLBACK" },
};

function CitationChips({ citations }: { citations: Citation[] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {citations.map((c) =>
        c.sourceUrl ? (
          <a
            key={c.chunkId}
            href={c.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-ink bg-paper px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors duration-75 hover:bg-ink hover:text-paper"
          >
            ↗ {c.title} · {c.credibility.toUpperCase()}
          </a>
        ) : (
          <span
            key={c.chunkId}
            title={`${c.sectionHeading} (updated ${c.updated})`}
            className="border border-ink bg-paper px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
          >
            {c.title} · {c.credibility.toUpperCase()}
          </span>
        ),
      )}
    </div>
  );
}

export function AiAdvisorPanel({
  context,
  advisory,
}: {
  context: AdvisorContext;
  advisory: AdvisoryResult | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          context,
          question: trimmed,
          history: messages.slice(-6).map(({ role, content }) => ({ role, content })),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Chat failed");
      const json = (await res.json()) as ChatResult;
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: json.answer.answer,
          source: json.source,
          caveats: json.answer.caveats,
          citations: json.citations,
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setSending(false);
    }
  }

  const badge = advisory ? SOURCE_BADGE[advisory.source] : null;

  return (
    <section className="border-2 border-ink bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink bg-ink px-4 py-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-acid">
          AI Advisory Assistant
        </span>
        {badge && (
          <span className="flex items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {advisory?.model && (
              <span className="font-mono text-[9px] uppercase text-paper/60">{advisory.model}</span>
            )}
          </span>
        )}
      </header>

      <div className="p-4 md:p-5">
        {!advisory ? (
          <p className="font-mono text-xs uppercase leading-relaxed text-ink-soft">
            Run an analysis to generate the advisory narration.
          </p>
        ) : (
          <>
            {advisory.error && (
              <p className="mb-3 border-l-8 border-caution bg-white px-3 py-1.5 font-mono text-[10px] uppercase leading-relaxed text-ink-soft">
                {advisory.error}
              </p>
            )}
            <p className="text-base font-medium leading-relaxed md:text-lg">
              {advisory.narrative.summary}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
              {advisory.narrative.recommendationExplanation}
            </p>

            {advisory.narrative.actions.length > 0 && (
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {advisory.narrative.actions.map((a, i) => (
                  <li key={a} className="flex gap-3 py-1.5 text-sm first:pt-0 last:pb-0">
                    <span aria-hidden className="font-mono text-xs font-bold text-acid-deep">
                      A{String(i + 1).padStart(2, "0")}
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            )}

            {advisory.narrative.warnings.length > 0 && (
              <ul className="mt-4 space-y-0.5 border-l-8 border-caution py-1 pl-3 font-mono text-[11px] uppercase leading-relaxed">
                {advisory.narrative.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}

            {advisory.citations && advisory.citations.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-soft">
                  Grounded reading
                </p>
                <CitationChips citations={advisory.citations} />
              </div>
            )}

            {messages.length === 0 && advisory.narrative.followUpQuestions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {advisory.narrative.followUpQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => void ask(q)}
                    disabled={sending}
                    className="border border-ink px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors duration-75 hover:bg-ink hover:text-paper disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-6 border-t-2 border-ink pt-4">
          {messages.length > 0 && (
            <ul className="mb-3 max-h-80 space-y-3 overflow-y-auto pr-1">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <li
                    key={i}
                    className="ml-auto w-fit max-w-[85%] border-2 border-ink bg-ink px-3 py-1.5 font-mono text-sm text-paper"
                  >
                    {m.content}
                  </li>
                ) : (
                  <li key={i} className="mr-auto max-w-[92%] border-2 border-ink bg-white px-3 py-2">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                    {m.caveats && m.caveats.length > 0 && (
                      <p className="mt-1 font-mono text-[9px] uppercase leading-relaxed text-ink-soft">
                        ⚠ {m.caveats.join(" · ")}
                      </p>
                    )}
                    {m.citations && m.citations.length > 0 && (
                      <CitationChips citations={m.citations} />
                    )}
                    {m.source && (
                      <Badge variant={SOURCE_BADGE[m.source].variant} className="mt-1.5">
                        {SOURCE_BADGE[m.source].label}
                      </Badge>
                    )}
                  </li>
                ),
              )}
            </ul>
          )}

          <form
            className="flex items-stretch gap-0"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask about this analysis — e.g. "why onion?" or "what if prices fall?"'
              maxLength={500}
              className="min-w-0 flex-1 border-2 border-r-0 border-ink bg-white px-3 py-2 font-mono text-sm focus:border-acid-deep focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || input.trim().length === 0}
              className="inline-flex shrink-0 items-center gap-1.5 border-2 border-ink bg-acid px-4 font-display text-sm uppercase transition-colors duration-75 hover:bg-ink hover:text-acid disabled:opacity-50"
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin" aria-hidden />
              ) : (
                <Send size={14} aria-hidden />
              )}
              Send →
            </button>
          </form>
          {error && (
            <p className="mt-2 border-l-8 border-alarm pl-2 font-mono text-[11px] uppercase text-alarm">
              ERROR // {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
