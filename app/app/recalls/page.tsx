import { Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { getRecallMatches } from "@/lib/db/queries";
import { vehicleLabel } from "@/lib/services/types";
import { RecallCard, type RecallCardData } from "@/components/cards/RecallCard";
import { Eyebrow, LinkButton } from "@/components/ui";
import type { Status } from "@/lib/status";
import { refreshRecallsAction } from "./actions";
import { PrepVisit } from "./PrepVisit";

export const dynamic = "force-dynamic";

const STATUS_RANK = { alert: 0, soon: 1, ok: 2 } as const;

function toSeverity(s: string): Status {
  return s === "alert" || s === "soon" || s === "ok" ? s : "soon";
}

function toRecallStatus(s: string): RecallCardData["status"] {
  return s === "open" || s === "remedy_available" || s === "closed" ? s : "open";
}

function toSource(s: string): RecallCardData["source"] {
  return s === "CPSC" ? "CPSC" : "NHTSA";
}

export default async function RecallsPage() {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);

  if (!active) {
    return (
      <div>
        <Eyebrow>Recall radar</Eyebrow>
        <h1 className="display-m mt-3 font-display text-chalk">Open recalls for your car.</h1>
        <div className="mt-8 rounded-card border border-hairline bg-surface p-8 text-center">
          <p className="text-ash">
            Add a car and we&apos;ll watch NHTSA and CPSC for recalls affecting your exact make, model, and year.
          </p>
          <div className="mt-5 flex justify-center">
            <LinkButton href="/app/onboarding">
              <Plus size={16} aria-hidden /> Add your car
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  const rows = await getRecallMatches(active.id);
  const sorted = [...rows].sort((a, b) => STATUS_RANK[toSeverity(a.severity)] - STATUS_RANK[toSeverity(b.severity)]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Recall radar</Eyebrow>
          <h1 className="display-m mt-3 font-display text-chalk">Recalls for your {vehicleLabel(active)}.</h1>
          <p className="mt-2 text-sm text-ash">From official feeds only — every match shows its campaign ID and source link.</p>
        </div>
        {/* Refresh is a direct server-action form (read-only fetch + revalidate). */}
        <form action={async () => { "use server"; await refreshRecallsAction(); }}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-btn border border-hairline px-4 py-2 text-sm font-medium text-chalk transition-colors hover:border-chalk/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          >
            <RefreshCw size={15} aria-hidden /> Refresh recalls
          </button>
        </form>
      </div>

      {sorted.length === 0 ? (
        <div className="mt-8 rounded-card border border-hairline bg-surface p-8 text-center">
          <ShieldCheck size={28} className="mx-auto text-ok" aria-hidden />
          <p className="mt-3 text-chalk">No open recalls on record for your {vehicleLabel(active)}.</p>
          <p className="mt-1 text-sm text-ash">
            That&apos;s good news. Recalls can be issued at any time — hit <span className="text-chalk">Refresh recalls</span> to
            re-check the official feeds.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {sorted.map((r) => {
            const data: RecallCardData = {
              severity: toSeverity(r.severity),
              source: toSource(r.source),
              campaignId: r.campaignId,
              component: r.component ?? "Affected component",
              summary: r.summary,
              remedy: r.remedy ?? "See the official notice for the remedy.",
              consequence: r.consequence,
              status: toRecallStatus(r.status),
              provenanceUrl: r.provenanceUrl,
            };
            return (
              <RecallCard
                key={r.id}
                data={data}
                action={
                  <PrepVisit
                    campaignId={r.campaignId}
                    component={data.component}
                    remedy={data.remedy}
                  />
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
