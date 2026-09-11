"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
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

const TRANSCRIPT_KEY = "ncadvisor-transcript-v1";

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
            className="border border-line bg-paper px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] transition-colors duration-300 hover:border-ink hover:text-ink"
          >
            ↗ {c.title} · {c.credibility.toUpperCase()}
          </a>
        ) : (
          <span
            key={c.chunkId}
            title={`${c.sectionHeading} (updated ${c.updated})`}
            className="border border-line bg-paper px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em]"
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
  const [keepTranscript, setKeepTranscript] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      if (localStorage.getItem(`${TRANSCRIPT_KEY}-enabled`) !== "1") return;
      const raw = localStorage.getItem(TRANSCRIPT_KEY);
      queueMicrotask(() => {
        if (cancelled) return;
        setKeepTranscript(true);
        if (raw) {
          const parsed = JSON.parse(raw) as ChatMessage[];
          if (Array.isArray(parsed)) setMessages(parsed);
        }
      });
    } catch {
      /* storage unavailable — ephemeral mode */
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        if (keepTranscript) {
          localStorage.setItem(`${TRANSCRIPT_KEY}-enabled`, "1");
          localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(messages.slice(-20)));
        } else {
          localStorage.removeItem(TRANSCRIPT_KEY);
          localStorage.removeItem(`${TRANSCRIPT_KEY}-enabled`);
        }
      } catch {
        /* storage unavailable — ephemeral mode */
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [messages, keepTranscript]);

  function clearTranscript() {
    setMessages([]);
    try {
      localStorage.removeItem(TRANSCRIPT_KEY);
    } catch {
      /* noop */
    }
  }

  const ask = useCallback(async (question: string) => {
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
  }, [context, messages, sending]);

  const badge = advisory ? SOURCE_BADGE[advisory.source] : null;

  return (
    <section className="border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper-dim px-5 py-2.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em]">
          AI Advisory Assistant
        </span>
        {badge && (
          <span className="flex items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {advisory?.model && (
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink-soft">{advisory.model}</span>
            )}
          </span>
        )}
      </header>

      <div className="p-5 md:p-6">
        {!advisory ? (
          <p className="font-mono text-[10px] uppercase leading-[1.8] tracking-[0.1em] text-ink-soft">
            Run an analysis to generate the advisory narration.
          </p>
        ) : (
          <>
            {advisory.error && (
              <p className="mb-4 border-l-2 border-caution bg-paper-dim px-4 py-2 font-mono text-[10px] uppercase leading-[1.6] tracking-[0.08em] text-ink-soft">
                {advisory.error}
              </p>
            )}
            <p className="font-display text-lg font-medium leading-[1.6] md:text-xl">
              {advisory.narrative.summary}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-[1.7] text-ink-soft">
              {advisory.narrative.recommendationExplanation}
            </p>

            {advisory.narrative.actions.length > 0 && (
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {advisory.narrative.actions.map((a, i) => (
                  <li key={a} className="flex gap-3 py-2 text-sm first:pt-0 last:pb-0">
                    <span aria-hidden className="font-mono text-[10px] font-bold text-vermilion">
                      A{String(i + 1).padStart(2, "0")}
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            )}

            {advisory.narrative.warnings.length > 0 && (
              <ul className="mt-5 space-y-0.5 border-l-2 border-caution py-1.5 pl-4 font-mono text-[10px] uppercase leading-[1.7] tracking-[0.08em]">
                {advisory.narrative.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}

            {advisory.citations && advisory.citations.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink-soft">
                  Grounded reading
                </p>
                <CitationChips citations={advisory.citations} />
              </div>
            )}

            {messages.length === 0 && advisory.narrative.followUpQuestions.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {advisory.narrative.followUpQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => void ask(q)}
                    disabled={sending}
                    className="border border-line px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft transition-all duration-300 hover:border-ink hover:text-ink disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-6 border-t border-line pt-5">
          {messages.length > 0 && (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-ink-soft">
                  {keepTranscript
                    ? "Transcript saved on this device only"
                    : "Ephemeral session — nothing stored"}
                </p>
                <button
                  onClick={clearTranscript}
                  className="flex items-center gap-1 border border-line px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-ink-soft transition-colors duration-300 hover:border-alarm hover:text-alarm"
                >
                  <Trash2 size={10} aria-hidden /> Clear
                </button>
              </div>
              <ul className="mb-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <li
                    key={i}
                    className="ml-auto w-fit max-w-[85%] border border-ink bg-ink px-4 py-2 font-mono text-sm text-paper"
                  >
                    {m.content}
                  </li>
                ) : (
                  <li key={i} className="mr-auto max-w-[92%] border border-line bg-paper-dim px-4 py-3">
                    <p className="whitespace-pre-wrap text-sm leading-[1.6]">{m.content}</p>
                    {m.caveats && m.caveats.length > 0 && (
                      <p className="mt-1.5 font-mono text-[8px] uppercase leading-[1.6] tracking-[0.08em] text-ink-soft">
                        ⚠ {m.caveats.join(" · ")}
                      </p>
                    )}
                    {m.citations && m.citations.length > 0 && (
                      <CitationChips citations={m.citations} />
                    )}
                    {m.source && (
                      <Badge variant={SOURCE_BADGE[m.source].variant} className="mt-2">
                        {SOURCE_BADGE[m.source].label}
                      </Badge>
                    )}
                  </li>
                ),
              )}
              </ul>
            </>
          )}

          <form
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <label className="flex cursor-pointer items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-ink-soft">
              <input
                type="checkbox"
                checked={keepTranscript}
                onChange={(e) => setKeepTranscript(e.target.checked)}
                className="h-3 w-3 accent-vermilion"
              />
              Keep transcript on this device
            </label>
            <div className="flex min-w-[240px] flex-1 items-stretch gap-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Ask about this analysis — e.g. "why onion?" or "what if prices fall?"'
                maxLength={500}
                className="min-w-0 flex-1 border border-r-0 border-line bg-white px-4 py-2.5 font-mono text-sm focus:border-ink focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending || input.trim().length === 0}
                className="inline-flex shrink-0 items-center gap-1.5 border border-ink bg-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-paper transition-colors duration-300 hover:bg-vermilion hover:border-vermilion disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                ) : (
                  <Send size={14} aria-hidden />
                )}
                Send →
              </button>
            </div>
          </form>
          {error && (
            <p className="mt-3 border-l-2 border-alarm pl-3 font-mono text-[10px] uppercase tracking-[0.08em] text-alarm">
              ERROR — {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
