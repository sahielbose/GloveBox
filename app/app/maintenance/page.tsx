import { Info, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { listServiceRecords, toVehicle } from "@/lib/db/queries";
import { computeHealth } from "@/lib/services/computeHealth";
import { vehicleLabel } from "@/lib/services/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Eyebrow, LinkButton } from "@/components/ui";
import { formatMiles, formatMoney } from "@/lib/utils";
import { MarkDone } from "./MarkDone";

export const dynamic = "force-dynamic";

const STATUS_RANK = { alert: 0, soon: 1, ok: 2 } as const;

function formatDueDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default async function MaintenancePage() {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);

  if (!active) {
    return (
      <div>
        <Eyebrow>Maintenance</Eyebrow>
        <h1 className="display-m mt-3 font-display text-chalk">What&apos;s due, tuned to your car.</h1>
        <div className="mt-8 rounded-card border border-hairline bg-surface p-8 text-center">
          <p className="text-ash">Add a car to see what maintenance is due by your exact make, model, and mileage.</p>
          <div className="mt-5 flex justify-center">
            <LinkButton href="/app/onboarding">
              <Plus size={16} aria-hidden /> Add your car
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  const records = await listServiceRecords(active.id);
  const health = computeHealth(
    toVehicle(active),
    active.mileage,
    records.map((r) => ({ type: r.type, jobKey: r.jobKey, mileage: r.mileage, date: r.date })),
  );

  const items = [...health.items].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Maintenance</Eyebrow>
          <h1 className="display-m mt-3 font-display text-chalk">What&apos;s due on your {vehicleLabel(active)}.</h1>
          <p className="mt-2 text-sm text-ash">
            Current odometer: <span className="font-mono text-chalk">{formatMiles(active.mileage)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <StatusBadge status="alert" label={`${health.counts.alert} overdue`} />
          <StatusBadge status="soon" label={`${health.counts.soon} soon`} />
          <StatusBadge status="ok" label={`${health.counts.ok} ok`} />
        </div>
      </div>

      {/* Estimate disclaimer — prominent. */}
      <p className="mt-6 flex items-start gap-2 rounded-card border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-chalk">
        <Info size={16} className="mt-0.5 shrink-0 text-warn" aria-hidden />
        <span>
          <span className="font-medium">Estimates — confirm against your owner&apos;s manual.</span>{" "}
          {health.disclaimer}
        </span>
      </p>

      <ol className="mt-8 space-y-3">
        {items.map((item) => {
          const dueDate = formatDueDate(item.dueDate);
          return (
            <li
              key={`${item.category}:${item.service}`}
              className="rounded-card border border-hairline bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <h2 className="text-base font-medium text-chalk">{item.service}</h2>
                    {item.safetyCritical && (
                      <span className="rounded-chip border border-hairline px-2 py-0.5 text-xs uppercase tracking-wide text-ash">
                        Safety
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-ash">{item.reason}</p>
                </div>
                <div className="shrink-0">
                  <MarkDone service={item.service} />
                </div>
              </div>

              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {item.dueMileage != null && (
                  <div className="flex items-center gap-1.5">
                    <dt className="text-ash">Due at</dt>
                    <dd className="font-mono text-chalk">{formatMiles(item.dueMileage)}</dd>
                  </div>
                )}
                {dueDate && (
                  <div className="flex items-center gap-1.5">
                    <dt className="text-ash">By</dt>
                    <dd className="font-mono text-chalk">{dueDate}</dd>
                  </div>
                )}
                {(item.intervalMiles != null || item.intervalMonths != null) && (
                  <div className="flex items-center gap-1.5">
                    <dt className="text-ash">Interval</dt>
                    <dd className="font-mono text-chalk">
                      {[
                        item.intervalMiles != null ? `${item.intervalMiles.toLocaleString()} mi` : null,
                        item.intervalMonths != null ? `${item.intervalMonths} mo` : null,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </dd>
                  </div>
                )}
                {item.estLowCents != null && item.estHighCents != null && (
                  <div className="flex items-center gap-1.5">
                    <dt className="text-ash">Typical cost</dt>
                    <dd className="font-mono text-chalk">
                      {formatMoney(item.estLowCents)}–{formatMoney(item.estHighCents)}
                      {item.laborHours != null && (
                        <span className="text-ash"> · ~{item.laborHours}h labor</span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>

              {item.note && <p className="mt-3 text-sm leading-relaxed text-ash">{item.note}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
