import { formatMoney } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { URGENCY_LABEL, URGENCY_TO_STATUS, type Urgency } from "@/lib/status";

export type SymptomCardData = {
  input: string;
  urgency: Urgency;
  urgencyReason?: string;
  causes: { cause: string; likelihood: "high" | "medium" | "low" }[];
  costLowCents?: number | null;
  costHighCents?: number | null;
  dtcCode?: string | null;
  summary?: string;
};

/** Symptom decoder card — likely cause, urgency (safe/soon/stop), rough cost. */
export function SymptomCard({ data }: { data: SymptomCardData }) {
  const top = data.causes[0];
  return (
    <div className="rounded-card border border-hairline bg-surface p-5">
      <p className="text-sm text-ash">
        <span className="text-ash">You said:</span> “{data.input}”
        {data.dtcCode && <span className="ml-2 font-mono text-xs text-ash">· {data.dtcCode}</span>}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {top && (
          <span className="text-base text-chalk">
            Likely: <span className="font-medium">{top.cause}</span>
          </span>
        )}
        <StatusBadge status={URGENCY_TO_STATUS[data.urgency]} label={URGENCY_LABEL[data.urgency]} />
      </div>

      {data.urgencyReason && <p className="mt-2 text-sm text-ash">{data.urgencyReason}</p>}

      {data.causes.length > 1 && (
        <ul className="mt-3 space-y-1 text-sm text-ash">
          {data.causes.slice(1, 4).map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase text-ash">{c.likelihood}</span>
              {c.cause}
            </li>
          ))}
        </ul>
      )}

      {(data.costLowCents != null && data.costHighCents != null) && (
        <p className="mt-4 font-mono text-sm text-chalk">
          Rough cost: {formatMoney(data.costLowCents)}–{formatMoney(data.costHighCents)}
          <span className="ml-2 text-xs text-ash">estimate</span>
        </p>
      )}
    </div>
  );
}
