"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowUp, ExternalLink, Quote } from "lucide-react";
import { Button, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ask, type ChatTurn } from "./actions";

type Citation = {
  n: number;
  label: string;
  url: string | null;
  snippet: string;
  similarity: number;
};

/** A rendered message in the thread. Assistant turns carry their grounding metadata. */
type Message =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      citations: Citation[];
      grounded: boolean;
      llmUsed: boolean;
    };

const STARTERS = [
  "What maintenance is due?",
  "Any open recalls?",
  "Is my last quote fair?",
  "What does my owner's manual say about oil?",
];

export function Chat({ carLabel }: { carLabel: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || isPending) return;
    setError(null);

    // The history we send is the thread BEFORE this question.
    const history: ChatTurn[] = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    startTransition(async () => {
      const res = await ask(trimmed, history);
      if (res.status === "error") {
        setError(res.message);
        return;
      }
      if (res.status === "ok") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: res.answer,
            citations: res.citations,
            grounded: res.grounded,
            llmUsed: res.llmUsed,
          },
        ]);
      }
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Thread */}
      <div className="flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="rounded-card border border-hairline bg-surface p-5">
            <p className="text-sm text-ash">
              Ask anything about <span className="text-chalk">{carLabel}</span>. Answers are grounded
              in your car&apos;s own data — its recalls, maintenance schedule, saved quotes, and any
              documents you&apos;ve uploaded. It&apos;s informational, not a guarantee.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  disabled={isPending}
                  className="rounded-chip border border-hairline px-3 py-1.5 text-sm text-ash transition-colors hover:border-sage hover:text-chalk disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-card bg-sage/15 px-4 py-3 text-chalk">
                <p className="whitespace-pre-wrap text-sm">{m.content}</p>
              </div>
            </div>
          ) : (
            <AssistantMessage key={i} message={m} />
          ),
        )}

        {isPending && (
          <div className="flex items-center gap-2 px-1 text-sm text-ash" aria-live="polite">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage" />
            Reading your car&apos;s context…
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-btn border border-alert/40 bg-alert/10 px-4 py-2.5 text-sm text-chalk">
          {error}
        </p>
      )}

      {/* Composer */}
      <form onSubmit={onSubmit} className="sticky bottom-4 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder={`Ask about ${carLabel}…`}
          aria-label="Ask GloveBox about your car"
          className={cn(inputClass, "min-h-[3rem] resize-none")}
          disabled={isPending}
        />
        <Button type="submit" disabled={isPending || !input.trim()} aria-label="Send question">
          <ArrowUp size={16} aria-hidden />
        </Button>
      </form>
    </div>
  );
}

function AssistantMessage({
  message,
}: {
  message: Extract<Message, { role: "assistant" }>;
}) {
  const { content, citations, grounded, llmUsed } = message;
  return (
    <div className="rounded-card border border-hairline bg-surface p-5">
      {/* The model's answer, rendered as-is — including any honest "not in your
          context" decline. We never hide it. */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-chalk">{content}</p>

      {!grounded && (
        <p className="mt-3 text-xs text-ash">
          No matching context found in your car&apos;s data — the assistant won&apos;t invent an
          answer.
        </p>
      )}

      {!llmUsed && grounded && (
        <p className="mt-3 rounded-btn border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-chalk">
          Full conversational answers need an <span className="font-mono">ANTHROPIC_API_KEY</span>.
          The grounded context from your car is still shown above.
        </p>
      )}

      {citations.length > 0 && (
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="eyebrow mb-3">Citations</p>
          <ul className="flex flex-col gap-3">
            {citations.map((c) => (
              <li key={c.n} className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs text-ash">[{c.n}]</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-chalk">{c.label}</span>
                    <span className="font-mono text-xs text-ash">
                      {Math.round(c.similarity * 100)}% match
                    </span>
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sage hover:text-sage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
                      >
                        Source <ExternalLink size={11} aria-hidden />
                      </a>
                    )}
                  </div>
                  <p className="mt-1 flex gap-1.5 text-xs leading-relaxed text-ash">
                    <Quote size={12} aria-hidden className="mt-0.5 shrink-0" />
                    <span>{c.snippet}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
