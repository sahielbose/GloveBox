import Link from "next/link";
import { Car, FileText, ArrowRight, Plus, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { listDocuments } from "@/lib/db/queries";
import { Eyebrow, LinkButton } from "@/components/ui";
import { formatMiles } from "@/lib/utils";
import {
  MileageForm,
  NicknameForm,
  PrimaryForm,
  DeleteForm,
  DocumentUploadForm,
} from "./VehicleForms";
import { PhotoForm } from "./PhotoForm";
import { switchActiveAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Vehicle profile" };

type Mpg = { cityMpg?: number; highwayMpg?: number; combinedMpg?: number };

export default async function VehiclePage() {
  const user = await requireUser();
  const { active, vehicles } = await getActiveVehicle(user.id);

  if (!active) return <EmptyState />;

  const specs = (active.specs ?? {}) as Record<string, unknown>;
  const bodyClass = asString(specs.bodyClass);
  const fuelType = asString(specs.fuelType);
  const mpg = (specs.mpg ?? null) as Mpg | null;

  const documents = await listDocuments(active.id);
  const otherCars = vehicles.filter((v) => v.id !== active.id);

  const carLabel = active.nickname || [active.year, active.make, active.model].filter(Boolean).join(" ");

  const specRows: { k: string; v: string | null; mono?: boolean }[] = [
    { k: "Year", v: active.year ? String(active.year) : null },
    { k: "Make", v: active.make },
    { k: "Model", v: active.model },
    { k: "Trim", v: active.trim },
    { k: "Engine", v: active.engine },
    { k: "Body class", v: bodyClass },
    { k: "Fuel type", v: fuelType },
    {
      k: "MPG (city / hwy / combined)",
      v: mpg
        ? [mpg.cityMpg, mpg.highwayMpg, mpg.combinedMpg]
            .map((n) => (n != null ? String(n) : "—"))
            .join(" / ")
        : null,
    },
    { k: "VIN", v: active.vin, mono: true },
  ];

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Vehicle profile</Eyebrow>
        <h1 className="display-l mt-3 text-chalk">{carLabel}</h1>
        <p className="mt-2 font-mono text-sm text-ash">
          {[active.year, active.make, active.model, active.trim].filter(Boolean).join(" ")} ·{" "}
          {formatMiles(active.mileage)}
        </p>
      </header>

      {/* Specs */}
      <section className="rounded-card border border-hairline bg-surface p-5">
        <h2 className="text-base font-medium text-chalk">Specs</h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {specRows.map((s) => (
            <div key={s.k}>
              <dt className="text-xs uppercase tracking-wide text-ash">{s.k}</dt>
              <dd className={`mt-0.5 text-sm text-chalk ${s.mono ? "font-mono break-all" : ""}`}>
                {s.v ?? "Not reported"}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-ash">
          Specs come from the public NHTSA vPIC decode and EPA FuelEconomy data. MPG is an EPA
          estimate, not a measured figure for your exact car.
        </p>
      </section>

      {/* Details: mileage + nickname */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-card border border-hairline bg-surface p-5">
          <h2 className="mb-4 text-base font-medium text-chalk">Mileage</h2>
          <MileageForm vehicleId={active.id} mileage={active.mileage} />
        </section>
        <section className="rounded-card border border-hairline bg-surface p-5">
          <h2 className="mb-4 text-base font-medium text-chalk">Nickname</h2>
          <NicknameForm vehicleId={active.id} nickname={active.nickname} />
        </section>
      </div>

      <div className="mt-5">
        <PhotoForm vehicleId={active.id} photoUrl={active.photoUrl} label={carLabel} />
      </div>

      {/* Documents */}
      <section className="rounded-card border border-hairline bg-surface p-5">
        <h2 className="flex items-center gap-2 text-base font-medium text-chalk">
          <FileText size={16} className="text-ash" aria-hidden />
          Documents
        </h2>
        <p className="mt-1 text-sm text-ash">
          Add your manual, insurance, registration, or receipts. Pasted text is fed to Ask GloveBox
          so it can answer from your own documents with citations.
        </p>

        <div className="mt-5">
          <DocumentUploadForm vehicleId={active.id} />
        </div>

        <div className="mt-6 border-t border-hairline pt-5">
          <h3 className="text-sm font-medium text-chalk">Saved documents</h3>
          {documents.length === 0 ? (
            <p className="mt-2 text-sm text-ash">Nothing saved yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {documents.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-chip border border-hairline px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-chalk">
                      {d.fileName || prettyKind(d.kind)}
                    </p>
                    <p className="text-xs text-ash">
                      {prettyKind(d.kind)}
                      {d.extractedText ? " · in Ask GloveBox" : ""}
                    </p>
                  </div>
                  {d.fileUrl ? (
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm text-ash underline underline-offset-4 hover:text-chalk"
                    >
                      Open <ExternalLink size={13} aria-hidden />
                    </a>
                  ) : (
                    <span className="shrink-0 text-xs text-ash">Text only</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Your cars */}
      <section className="rounded-card border border-hairline bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-medium text-chalk">
            <Car size={16} className="text-ash" aria-hidden />
            Your cars
          </h2>
          <Link
            href="/app/onboarding"
            className="inline-flex items-center gap-1 text-xs text-ash underline-offset-4 hover:text-chalk hover:underline"
          >
            <Plus size={12} aria-hidden /> Add a car
          </Link>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          <PrimaryForm vehicleId={active.id} isPrimary={active.isPrimary} />
        </div>

        {otherCars.length > 0 && (
          <div className="border-t border-hairline pt-4">
            <h3 className="text-sm font-medium text-chalk">Switch to another car</h3>
            <ul className="mt-3 space-y-2">
              {otherCars.map((v) => (
                <li key={v.id}>
                  <form action={switchActiveAction}>
                    <input type="hidden" name="vehicleId" value={v.id} />
                    <button
                      type="submit"
                      className="group flex w-full items-center justify-between gap-3 rounded-chip border border-hairline px-3 py-2 text-left transition-colors hover:border-chalk/30"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-chalk">
                          {v.nickname || [v.year, v.make, v.model].filter(Boolean).join(" ")}
                        </span>
                        <span className="block truncate text-xs text-ash">
                          {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                          {v.isPrimary ? " · primary" : ""}
                        </span>
                      </span>
                      <ArrowRight
                        size={15}
                        className="shrink-0 text-ash transition-transform group-hover:translate-x-0.5 group-hover:text-chalk"
                        aria-hidden
                      />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <section className="rounded-card border border-hairline bg-surface p-5">
        <h2 className="text-base font-medium text-chalk">Remove car</h2>
        <p className="mt-1 text-sm text-ash">
          Deleting a car is permanent and removes its full history.
        </p>
        <div className="mt-4">
          <DeleteForm vehicleId={active.id} label={carLabel} />
        </div>
      </section>
    </div>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-btn border border-hairline text-sage">
        <Car size={20} aria-hidden />
      </span>
      <h1 className="display-m mt-5 text-chalk">No car yet.</h1>
      <p className="lead mt-3 text-ash">Add your car to see its profile, specs, and documents.</p>
      <div className="mt-7 flex justify-center">
        <LinkButton href="/app/onboarding">
          <Plus size={15} aria-hidden /> Add your car
        </LinkButton>
      </div>
    </div>
  );
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function prettyKind(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}
