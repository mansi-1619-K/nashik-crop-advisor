"use client";

import { useState } from "react";
import { BookOpen, Loader2, MessageCircleQuestion, Send, Sparkles } from "lucide-react";
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
      <BookOpen size={12} className="text-sky-600" aria-hidden />
      {citations.map((c) =>
        c.sourceUrl ? (
          <a
            key={c.chunkId}
            href={c.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700 hover:bg-sky-100"
          >
            {c.title} · {c.organization} · {c.credibility.toUpperCase()}
          </a>
        ) : (
          <span
            key={c.chunkId}
            title={`${c.sectionHeading} (updated ${c.updated})`}
            className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] text-sky-700"
          >
            {c.title} · {c.organization} · {c.credibility.toUpperCase()}
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
    <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold text-zinc-900">
          <Sparkles size={18} className="text-violet-600" aria-hidden />
          AI Advisory Assistant
        </h3>
        {badge && (
          <div className="flex items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {advisory?.model && <span className="text-[11px] text-zinc-400">{advisory.model}</span>}
          </div>
        )}
      </div>

      {!advisory ? (
        <p className="mt-3 text-sm text-zinc-500">Run an analysis to generate the advisory narration.</p>
      ) : (
        <>
          {advisory.error && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
              {advisory.error}
            </p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-zinc-800">{advisory.narrative.summary}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {advisory.narrative.recommendationExplanation}
          </p>

          {advisory.narrative.actions.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
              {advisory.narrative.actions.map((a) => (
                <li key={a} className="flex gap-2">
                  <span aria-hidden>▸</span>
                  {a}
                </li>
              ))}
            </ul>
          )}

          {advisory.narrative.warnings.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              {advisory.narrative.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}

          {advisory.citations && advisory.citations.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
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
                  className="rounded-full border border-violet-300 bg-white px-3 py-1 text-xs text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-5 border-t border-violet-200 pt-4">
        {messages.length > 0 && (
          <ul className="mb-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <li key={i} className="ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm bg-emerald-600 px-3 py-1.5 text-sm text-white">
                  {m.content}
                </li>
              ) : (
                <li key={i} className="mr-auto max-w-[90%] rounded-lg rounded-bl-sm bg-white px-3 py-2 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm text-zinc-800">{m.content}</p>
                  {m.caveats && m.caveats.length > 0 && (
                    <p className="mt-1 text-[11px] text-zinc-400">⚠ {m.caveats.join(" · ")}</p>
                  )}
                  {m.citations && m.citations.length > 0 && (
                    <CitationChips citations={m.citations} />
                  )}
                  {m.source && (
                    <Badge variant={SOURCE_BADGE[m.source].variant} className="mt-1">
                      {SOURCE_BADGE[m.source].label}
                    </Badge>
                  )}
                </li>
              ),
            )}
          </ul>
        )}

        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
        >
          <MessageCircleQuestion size={16} className="shrink-0 text-zinc-400" aria-hidden />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask about this analysis — e.g. "why onion?" or "what if prices fall?"'
            maxLength={500}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
          <button
            type="submit"
            disabled={sending || input.trim().length === 0}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {sending ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Send size={14} aria-hidden />}
            Ask
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
