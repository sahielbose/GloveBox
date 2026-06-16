import { StatusBadge } from "@/components/StatusBadge";
import type { Status } from "@/lib/status";

export type InspectionCardData = {
  overall: Status;
  counts: { ok: number; soon: number; alert: number };
  summary: string;
  disclaimer: string;
  items: {
    item: string;
    area: string;
    status: Status;
    measurement: string | null;
    note: string;
    safetyCritical: boolean;
  }[];
};

/** Health Check card — a digitized shop inspection as green/yellow/red items. */
export function InspectionCard({ data }: { data: InspectionCardData }) {
  return (
    <div className="rounded-card border border-hairline bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-chalk">Health check</span>
          <StatusBadge status={data.overall} />
        </div>
        <span className="font-mono text-xs text-ash">
          {data.counts.ok} ok · {data.counts.soon} soon · {data.counts.alert} alert
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ash">{data.summary}</p>

      <ul className="mt-4 divide-y divide-hairline">
        {data.items.map((it, i) => (
          <li key={i} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-chalk">{it.item}</span>
                {it.safetyCritical && (
                  <span className="rounded-chip border border-hairline px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide text-ash">
                    safety
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ash">{it.note}</p>
              <span className="mt-1 inline-block font-mono text-[0.7rem] uppercase text-ash/70">{it.area}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {it.measurement && <span className="font-mono text-xs text-ash">{it.measurement}</span>}
              <StatusBadge status={it.status} />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-ash/80">{data.disclaimer}</p>
    </div>
  );
}
