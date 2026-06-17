"use client";
import { useState, useTransition } from "react";
import { MessageSquareText, Copy, Check } from "lucide-react";
import { draftShopMessageAction } from "@/lib/actions/draft";
import { inputClass } from "@/components/ui";

/**
 * Draft-a-message-to-the-shop. Generates a draft on demand and shows it in a
 * read-only box with a Copy button. GloveBox never sends it — the owner does.
 */
export function DraftMessage({
  kind,
  detail,
  label = "Draft a message to the shop",
}: {
  kind: "quote" | "symptom" | "recall" | "general";
  detail: string;
  label?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  if (!draft) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await draftShopMessageAction(kind, detail);
            if (r.ok && r.draft) setDraft(r.draft);
          })
        }
        className="inline-flex items-center gap-2 rounded-btn border border-hairline px-4 py-2.5 text-sm font-medium text-chalk transition-colors hover:border-chalk/30 disabled:opacity-50"
      >
        <MessageSquareText size={15} aria-hidden /> {pending ? "Drafting…" : label}
      </button>
    );
  }

  return (
    <div className="w-full rounded-card border border-hairline bg-ink/40 p-4">
      <textarea readOnly value={draft} rows={6} className={`${inputClass} resize-y text-sm`} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(draft);
            setCopied(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-btn bg-sage px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sage-hover"
        >
          {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
        <span className="text-xs text-ash">
          Review and send it yourself — GloveBox never messages a shop on your behalf.
        </span>
      </div>
    </div>
  );
}
