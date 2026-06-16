import Link from "next/link";
import {
  Wrench,
  ShieldAlert,
  NotebookPen,
  MessageCircleQuestion,
  ArrowRight,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { listServiceRecords, getRecallMatches, toVehicle } from "@/lib/db/queries";
import { computeHealth } from "@/lib/services/computeHealth";
import { StatusBadge } from "@/components/StatusBadge";
import { RecallCard, type RecallCardData } from "@/components/cards/RecallCard";
import { Eyebrow, LinkButton } from "@/components/ui";
import { formatMoney, formatMiles, cn } from "@/lib/utils";
import type { Status } from "@/lib/status";

export const dynamic = "force-dynamic";

export const metadata = { title: "Dashboard" };

const RANK: Record<Status, number> = { ok: 0, soon: 1, alert: 2 };

export default async function DashboardPage() {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);

  if (!active) return <EmptyState />;

  const records = await listServiceRecords(active.id);
  const health = computeHealth(
    toVehicle(active),
    active.mileage,
    records.map((r) => ({ type: r.type, mileage: r.mileage, date: r.date })),
  );

  const recalls = await getRecallMatches(active.id);
  const topRecall = [...recalls].sort(
    (a, b) => RANK[b.severity as Status] - RANK[a.severity as Status],
  )[0];

  const dueNext = health.items.filter((i) => i.status !== "ok").slice(0, 4);
  const flaggedTop = health.items.filter((i) => i.status !== "ok").slice(0, 3);
  const recentService = records.slice(0, 3);

  const carLabel = active.nickname || [active.year, active.make, active.model].filter(Boolean).join(" ");

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Dashboard</Eyebrow>
        <h1 className="display-l mt-3 text-chalk">{carLabel}</h1>
        <p className="mt-2 font-mono text-sm text-ash">
          {[active.year, active.make, active.model, active.trim].filter(Boolean).join(" ")} ·{" "}
          {formatMiles(active.mileage)}
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Health summary */}
        <Panel
          title="Health summary"
          href="/app/maintenance"
          hrefLabel="See maintenance"
          icon={Wrench}
          className="md:row-span-2"
        >
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={health.overall} />
            <span className="text-sm text-ash">
              {health.counts.ok} OK · {health.counts.soon} soon · {health.counts.alert} overdue
            </span>
          </div>

          {flaggedTop.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-ash">
              <CheckCircle2 size={15} className="text-ok" aria-hidden />
              Nothing needs attention right now.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {flaggedTop.map((item) => (
                <li key={item.service} className="border-t border-hairline pt-3 first:border-0 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-chalk">{item.service}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-sm text-ash">{item.reason}</p>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-ash">{health.disclaimer}</p>
        </Panel>

        {/* What's due next */}
        <Panel title="What's due next" href="/app/maintenance" hrefLabel="See all" icon={Wrench}>
          {dueNext.length === 0 ? (
            <p className="text-sm text-ash">Nothing due soon. Estimate — confirm against your owner&apos;s manual.</p>
          ) : (
            <ul className="space-y-2.5">
              {dueNext.map((item) => (
                <li key={item.service} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-chalk">{item.service}</p>
                    <p className="truncate text-xs text-ash">{item.reason}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-ash">Estimated due dates — confirm against your owner&apos;s manual.</p>
        </Panel>

        {/* Open recalls */}
        <Panel title="Open recalls" href="/app/recalls" hrefLabel="Recall radar" icon={ShieldAlert}>
          {recalls.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-ash">
              <CheckCircle2 size={15} className="text-ok" aria-hidden />
              No open recalls found. We synced official feeds when you added this car.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-ash">
                {recalls.length} open {recalls.length === 1 ? "recall" : "recalls"} matched from
                official feeds.
              </p>
              {topRecall && (
                <RecallCard
                  data={
                    {
                      severity: topRecall.severity as Status,
                      source: topRecall.source as "NHTSA" | "CPSC",
                      campaignId: topRecall.campaignId,
                      component: topRecall.component ?? "Affected component",
                      summary: topRecall.summary,
                      remedy: topRecall.remedy ?? "See the official notice for the remedy.",
                      consequence: topRecall.consequence,
                      status: topRecall.status as RecallCardData["status"],
                      provenanceUrl: topRecall.provenanceUrl,
                    } satisfies RecallCardData
                  }
                />
              )}
            </div>
          )}
        </Panel>

        {/* Recent service */}
        <Panel title="Recent service" href="/app/log" hrefLabel="Service log" icon={NotebookPen}>
          {recentService.length === 0 ? (
            <p className="text-sm text-ash">No service logged yet. Add an entry to start your history.</p>
          ) : (
            <ul className="space-y-3">
              {recentService.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-3 border-t border-hairline pt-3 first:border-0 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-chalk">{r.description || prettyType(r.type)}</p>
                    <p className="text-xs text-ash">
                      {formatDate(r.date)}
                      {r.mileage != null && ` · ${formatMiles(r.mileage)}`}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm text-ash">{formatMoney(r.costCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Ask GloveBox */}
      <Link
        href="/app/assistant"
        className="group block rounded-card border border-hairline bg-surface p-5 transition-colors hover:border-chalk/20"
      >
        <div className="flex items-center gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-btn border border-hairline text-sage">
            <MessageCircleQuestion size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-chalk">Ask GloveBox</p>
            <p className="truncate text-sm text-ash">
              &ldquo;Is my next service overdue?&rdquo; · &ldquo;What does this recall mean?&rdquo;
            </p>
          </div>
          <ArrowRight
            size={16}
            className="shrink-0 text-ash transition-transform group-hover:translate-x-0.5 group-hover:text-chalk"
            aria-hidden
          />
        </div>
      </Link>
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

function Panel({
  title,
  href,
  hrefLabel,
  icon: Icon,
  className,
  children,
}: {
  title: string;
  href: string;
  hrefLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-card border border-hairline bg-surface p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-medium text-chalk">
          <Icon size={16} className="text-ash" aria-hidden />
          {title}
        </h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs text-ash underline-offset-4 hover:text-chalk hover:underline"
        >
          {hrefLabel}
          <ArrowRight size={12} aria-hidden />
        </Link>
      </div>
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-btn border border-hairline text-sage">
        <Plus size={20} aria-hidden />
      </span>
      <h1 className="display-m mt-5 text-chalk">No car yet.</h1>
      <p className="lead mt-3 text-ash">
        Add your car and GloveBox will start tracking maintenance, watching recalls, and answering
        questions about it.
      </p>
      <div className="mt-7 flex justify-center">
        <LinkButton href="/app/onboarding">
          <Plus size={15} aria-hidden /> Add your car
        </LinkButton>
      </div>
    </div>
  );
}

function prettyType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
