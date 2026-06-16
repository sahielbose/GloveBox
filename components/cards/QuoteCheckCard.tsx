import { Flag } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { VERDICT_LABEL, VERDICT_TO_STATUS, type Verdict } from "@/lib/status";

export type QuoteCardData = {
  vehicleLabel: string;
  mileage?: number | null;
  shopName?: string | null;
  jobLabel?: string;
  totalCents: number;
  fairLowCents: number;
  fairHighCents: number;
  verdict: Verdict;
  flags: { lineItem: string; reason: string; severity: "soon" | "alert" }[];
  provenance: string[];
};

/**
 * The signature Quote Check verdict card (§5). A horizontal range showing the
 * typical price near you, with the quoted figure as a marker, plus flagged items.
 */
export function QuoteCheckCard({ data }: { data: QuoteCardData }) {
  const min = Math.min(data.fairLowCents * 0.7, data.totalCents * 0.95);
  const max = Math.max(data.fairHighCents * 1.25, data.totalCents * 1.05);
  const span = Math.max(1, max - min);
  const pos = (c: number) => `${Math.min(100, Math.max(0, ((c - min) / span) * 100))}%`;
  const status = VERDICT_TO_STATUS[data.verdict];

  return (
    <div className="w-full max-w-md rounded-card border border-hairline bg-surface p-5 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-chalk">Quote check</span>
        <span className="font-mono text-[0.8125rem] text-ash">
          {data.vehicleLabel}
          {data.mileage ? ` · ${data.mileage.toLocaleString()} mi` : ""}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between border-b border-hairline pb-4">
        <span className="text-sm text-ash">
          {data.shopName ?? "Estimate"}
          {data.jobLabel ? ` — ${data.jobLabel}` : ""}
        </span>
        <span className="font-mono text-2xl text-chalk">{formatMoney(data.totalCents)}</span>
      </div>

      {/* Verdict bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-ash">
          <span>Typical near you</span>
          <StatusBadge status={status} label={VERDICT_LABEL[data.verdict]} />
        </div>
        <div className="relative mt-2 h-2.5 rounded-full bg-ash/20">
          <div
            className="absolute top-0 h-2.5 rounded-full bg-ok/40"
            style={{ left: pos(data.fairLowCents), right: `calc(100% - ${pos(data.fairHighCents)})` }}
          />
          <div
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink"
            style={{ left: pos(data.totalCents), background: status === "ok" ? "var(--ok)" : status === "soon" ? "var(--warn)" : "var(--alert)" }}
            aria-label="quoted amount marker"
          />
        </div>
        <div className="mt-1.5 font-mono text-xs text-ash">
          {formatMoney(data.fairLowCents)}–{formatMoney(data.fairHighCents)}
          <span className="text-ash/70"> · you were quoted {formatMoney(data.totalCents)}</span>
        </div>
      </div>

      {/* Flagged items */}
      {data.flags.length > 0 && (
        <ul className="mt-4 space-y-2">
          {data.flags.slice(0, 3).map((f, i) => (
            <li key={i} className="rounded-chip border border-hairline bg-ink/40 p-3">
              <div className="flex items-center gap-2 text-sm text-chalk">
                <Flag size={14} style={{ color: f.severity === "alert" ? "var(--alert)" : "var(--warn)" }} aria-hidden />
                <span className="font-medium">{f.lineItem}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ash">{f.reason}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Provenance chips */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {data.provenance.map((p) => (
          <span key={p} className="chip">{p}</span>
        ))}
      </div>
    </div>
  );
}
