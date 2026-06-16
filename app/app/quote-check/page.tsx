import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { toVehicle, listQuoteChecks } from "@/lib/db/queries";
import { vehicleLabel } from "@/lib/services/types";
import { ALL_RATES } from "@/data";
import { LinkButton } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { VERDICT_LABEL, VERDICT_TO_STATUS, type Verdict } from "@/lib/status";
import { formatMoney } from "@/lib/utils";
import { QuoteCheckForm } from "./QuoteCheckForm";

export const dynamic = "force-dynamic";

export default async function QuoteCheckPage() {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);

  if (!active) {
    return (
      <div>
        <span className="eyebrow">Quote check</span>
        <h1 className="display-m mt-4">Is this quote fair?</h1>
        <div className="mt-8 rounded-card border border-hairline bg-surface p-8 text-center">
          <p className="text-ash">Add your car first, then paste an estimate to check it.</p>
          <div className="mt-5 flex justify-center">
            <LinkButton href="/app/onboarding">Add your car</LinkButton>
          </div>
        </div>
      </div>
    );
  }

  const v = toVehicle(active);
  const label = vehicleLabel(v);
  const regions = ALL_RATES.filter((r) => r.region !== "national").map((r) => ({
    value: r.region,
    label: r.label,
  }));

  const history = await listQuoteChecks(active.id);

  return (
    <div>
      <span className="eyebrow">Quote check</span>
      <h1 className="display-m mt-4">Is this quote fair?</h1>
      <p className="lead mt-4 max-w-2xl text-ash">
        Paste a repair estimate and get a plain-English verdict for your{" "}
        <span className="text-chalk">{label}</span> — a fair range for your make, model, and
        region, with the line items worth questioning. Pricing is a labeled estimate from curated
        public data, never an invented price.
      </p>

      <div className="mt-8">
        <QuoteCheckForm vehicleLabel={label} mileage={active.mileage ?? null} regions={regions} />
      </div>

      {/* Quote history */}
      <section className="mt-14" aria-label="Quote history">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow">Quote history</span>
          {history.length > 0 && (
            <span className="text-xs text-ash">
              {history.length} check{history.length === 1 ? "" : "s"} for {label}
            </span>
          )}
        </div>

        {history.length === 0 ? (
          <p className="mt-4 rounded-card border border-hairline bg-surface p-5 text-sm text-ash">
            No quotes checked yet. Your saved checks will show up here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface">
            {history.map((q) => {
              const verdict = q.verdict as Verdict;
              const date = new Date(q.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <li
                  key={q.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-chalk">
                      <span className="font-medium">{q.shopName ?? "Estimate"}</span>
                      <span className="text-xs text-ash">· {date}</span>
                    </div>
                    <div className="mt-0.5 font-mono text-xs text-ash">
                      {formatMoney(q.totalCents)}{" "}
                      <span className="text-ash/70">
                        vs typical {formatMoney(q.fairLowCents)}–{formatMoney(q.fairHighCents)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge
                    status={VERDICT_TO_STATUS[verdict] ?? "soon"}
                    label={VERDICT_LABEL[verdict] ?? q.verdict}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Trust line */}
      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-ash">
        Informational, not a guarantee. The fair range is built from a curated labor-time catalog,
        regional labor rates, and parts price ranges — confirm with a professional before you
        decide. GloveBox never handles payment or books anything on your behalf.
      </p>

      <p className="mt-3">
        <Link href="/app/symptoms" className="text-sm text-sage hover:text-sage-hover">
          Not sure what the repair is? Decode a symptom first →
        </Link>
      </p>
    </div>
  );
}
