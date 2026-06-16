import { Download, FileText, Plus, Receipt, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { listServiceRecords } from "@/lib/db/queries";
import { vehicleLabel } from "@/lib/services/types";
import { Eyebrow, LinkButton } from "@/components/ui";
import { formatMoney } from "@/lib/utils";
import { LogCapture } from "./LogCapture";
import { deleteLogEntryAction } from "./actions";

export const dynamic = "force-dynamic";

const SOURCE_LABEL: Record<string, string> = {
  manual: "Manual",
  voice: "Voice",
  quote_check: "Quote check",
  maintenance: "Maintenance",
  import: "Import",
};

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function LogPage() {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);

  if (!active) {
    return (
      <div>
        <Eyebrow>Service log</Eyebrow>
        <h1 className="display-m mt-3 font-display text-chalk">Your car&apos;s whole history.</h1>
        <div className="mt-8 rounded-card border border-hairline bg-surface p-8 text-center">
          <p className="text-ash">Add a car to start logging service by voice or text, attach receipts, and export a clean history.</p>
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

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Service log</Eyebrow>
          <h1 className="display-m mt-3 font-display text-chalk">Service log — {vehicleLabel(active)}.</h1>
          <p className="mt-2 text-sm text-ash">Every oil change, part, and receipt in one place. Export a clean history the day you sell.</p>
        </div>
        {records.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Exports are explicit, user-clicked downloads (confirm-gated by the click). */}
            <a
              href="/app/log/export?format=csv"
              className="inline-flex items-center gap-1.5 rounded-btn border border-hairline px-3 py-2 text-sm text-chalk transition-colors hover:border-chalk/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            >
              <Download size={15} aria-hidden /> CSV
            </a>
            <a
              href="/app/log/export?format=pdf"
              className="inline-flex items-center gap-1.5 rounded-btn border border-hairline px-3 py-2 text-sm text-chalk transition-colors hover:border-chalk/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            >
              <FileText size={15} aria-hidden /> PDF
            </a>
          </div>
        )}
      </div>

      <div className="mt-6">
        <LogCapture />
      </div>

      <h2 className="mt-10 text-sm font-medium uppercase tracking-wide text-ash">History</h2>

      {records.length === 0 ? (
        <div className="mt-3 rounded-card border border-hairline bg-surface p-8 text-center text-ash">
          No entries yet. Add your first above — by voice or text.
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {records.map((r) => (
            <li key={r.id} className="rounded-card border border-hairline bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium text-chalk">{r.type}</h3>
                    <span className="rounded-chip border border-hairline px-2 py-0.5 text-xs uppercase tracking-wide text-ash">
                      {SOURCE_LABEL[r.source] ?? r.source}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-ash">
                    {formatDate(r.date)}
                    {r.mileage != null && <> · {r.mileage.toLocaleString()} mi</>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {r.costCents != null && (
                    <span className="font-mono text-sm text-chalk">{formatMoney(r.costCents)}</span>
                  )}
                  <form action={deleteLogEntryAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="rounded-chip p-1.5 text-ash transition-colors hover:text-alert focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
                      aria-label={`Delete ${r.type} entry`}
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </form>
                </div>
              </div>

              {r.description && <p className="mt-3 text-sm leading-relaxed text-ash">{r.description}</p>}

              {r.parts && r.parts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.parts.map((p, i) => (
                    <span key={i} className="rounded-chip border border-hairline px-2 py-0.5 font-mono text-xs text-ash">
                      {p.name}
                      {p.partNumber ? ` · ${p.partNumber}` : ""}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                {r.laborHours != null && (
                  <span className="text-ash">
                    Labor: <span className="font-mono text-chalk">{r.laborHours} hr</span>
                  </span>
                )}
                {r.receiptUrl && (
                  <a
                    href={r.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-ash underline hover:text-chalk"
                  >
                    <Receipt size={13} aria-hidden /> Receipt
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
