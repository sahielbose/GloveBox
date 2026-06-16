import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { toVehicle, listSymptomReports } from "@/lib/db/queries";
import { vehicleLabel } from "@/lib/services/types";
import { LinkButton } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { URGENCY_LABEL, URGENCY_TO_STATUS, type Urgency } from "@/lib/status";
import { formatMoney } from "@/lib/utils";
import { SymptomForm } from "./SymptomForm";

export const dynamic = "force-dynamic";

export default async function SymptomsPage() {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);

  if (!active) {
    return (
      <div>
        <span className="eyebrow">Symptom decoder</span>
        <h1 className="display-m mt-4">What&apos;s your car doing?</h1>
        <div className="mt-8 rounded-card border border-hairline bg-surface p-8 text-center">
          <p className="text-ash">
            Add your car first — then describe a noise, smell, or warning light and we&apos;ll
            decode it for your exact vehicle.
          </p>
          <div className="mt-5 flex justify-center">
            <LinkButton href="/app/onboarding">Add your car</LinkButton>
          </div>
        </div>
      </div>
    );
  }

  const label = vehicleLabel(toVehicle(active));
  const history = await listSymptomReports(active.id);

  return (
    <div>
      <span className="eyebrow">Symptom decoder</span>
      <h1 className="display-m mt-4">What&apos;s your car doing?</h1>
      <p className="lead mt-4 max-w-2xl text-ash">
        Describe a noise, smell, or behavior — or enter a dashboard trouble code — and get the
        likely cause, how urgent it is, and a rough cost for your{" "}
        <span className="text-chalk">{label}</span> before you call the shop.
      </p>

      <div className="mt-8">
        <SymptomForm vehicleLabel={label} />
      </div>

      {/* Symptom history */}
      <section className="mt-14" aria-label="Symptom history">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow">Symptom history</span>
          {history.length > 0 && (
            <span className="text-xs text-ash">
              {history.length} report{history.length === 1 ? "" : "s"} for {label}
            </span>
          )}
        </div>

        {history.length === 0 ? (
          <p className="mt-4 rounded-card border border-hairline bg-surface p-5 text-sm text-ash">
            No symptoms decoded yet. What you check will show up here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface">
            {history.map((s) => {
              const urgency = s.urgency as Urgency;
              const date = new Date(s.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const topCause = s.causes?.[0]?.cause;
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-chalk">
                      <span className="truncate font-medium">
                        {s.input || topCause || "Symptom report"}
                      </span>
                      {s.dtcCode && (
                        <span className="font-mono text-xs text-ash">· {s.dtcCode}</span>
                      )}
                      <span className="text-xs text-ash">· {date}</span>
                    </div>
                    {(s.estLowCents != null && s.estHighCents != null) && (
                      <div className="mt-0.5 font-mono text-xs text-ash">
                        rough {formatMoney(s.estLowCents)}–{formatMoney(s.estHighCents)}
                      </div>
                    )}
                  </div>
                  <StatusBadge
                    status={URGENCY_TO_STATUS[urgency] ?? "soon"}
                    label={URGENCY_LABEL[urgency] ?? s.urgency}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Trust line */}
      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-ash">
        Informational, not a diagnosis. For brakes, steering, overheating, airbags, and tires we
        err toward “get it inspected” — we will never reassure you about a potentially unsafe
        condition. Confirm with a professional.
      </p>

      <p className="mt-3">
        <Link href="/app/quote-check" className="text-sm text-sage hover:text-sage-hover">
          Already have an estimate for this? Check whether it&apos;s fair →
        </Link>
      </p>
    </div>
  );
}
