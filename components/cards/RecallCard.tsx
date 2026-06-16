import { ExternalLink, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { Status } from "@/lib/status";

export type RecallCardData = {
  severity: Status;
  source: "NHTSA" | "CPSC";
  campaignId: string;
  component: string;
  summary: string;
  remedy: string;
  consequence?: string | null;
  status: "open" | "remedy_available" | "closed";
  provenanceUrl: string;
  parkIt?: boolean | null;
  parkOutside?: boolean | null;
};

const STATUS_WORD: Record<RecallCardData["status"], string> = {
  open: "Open recall",
  remedy_available: "Open · free fix available",
  closed: "Closed",
};

/** Recall radar card — severity as icon + word, campaign ID + source link, remedy. */
export function RecallCard({ data, action }: { data: RecallCardData; action?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-hairline bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={data.severity} label={STATUS_WORD[data.status]} />
        <span className="font-mono text-xs text-ash">
          {data.source} · {data.campaignId}
        </span>
      </div>

      <h3 className="mt-3 flex items-start gap-2 text-base font-medium text-chalk">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-ash" aria-hidden />
        {data.component}
      </h3>

      {(data.parkIt || data.parkOutside) && (
        <p className="mt-2 rounded-chip border border-alert/40 bg-alert/10 px-3 py-2 text-sm text-chalk">
          {data.parkIt ? "NHTSA advises: do not drive until repaired." : "NHTSA advises: park away from structures until repaired."}
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-ash">{data.summary}</p>

      {data.consequence && (
        <p className="mt-2 text-sm leading-relaxed text-ash">
          <span className="text-chalk">Risk:</span> {data.consequence}
        </p>
      )}

      <div className="mt-3 rounded-chip border border-hairline bg-ink/40 p-3">
        <span className="text-xs uppercase tracking-wide text-ash">Remedy</span>
        <p className="mt-1 text-sm text-chalk">{data.remedy}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {action}
        <a
          href={data.provenanceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-ash underline hover:text-chalk"
        >
          Official notice <ExternalLink size={13} aria-hidden />
        </a>
      </div>
    </div>
  );
}
