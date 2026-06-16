import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { listDocuments } from "@/lib/db/queries";
import { vehicleLabel } from "@/lib/services/types";
import { Eyebrow, LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Health check" };

export default async function InspectionPage() {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);

  if (!active) {
    return (
      <div>
        <Eyebrow>Health check</Eyebrow>
        <h1 className="display-m mt-3 font-display text-chalk">Digitize a shop inspection.</h1>
        <div className="mt-8 rounded-card border border-hairline bg-surface p-8 text-center">
          <p className="text-chalk">Add a car first to digitize its inspection sheets.</p>
          <div className="mt-5 flex justify-center">
            <LinkButton href="/app/onboarding">Add your car</LinkButton>
          </div>
        </div>
      </div>
    );
  }

  const docs = await listDocuments(active.id);
  const past = docs.filter((d) => d.kind === "inspection");

  const { InspectionForm } = await import("./InspectionForm");

  return (
    <div>
      <Eyebrow>Health check</Eyebrow>
      <h1 className="display-m mt-3 font-display text-chalk">
        Digitize the shop&apos;s inspection.
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ash">
        Turn the green/yellow/red sheet from your {vehicleLabel(active)}&apos;s last visit into a
        clear Health Check — measurements, what each item means, and what&apos;s actually urgent.
        We never downplay a brake, tire, or steering item.
      </p>

      <InspectionForm />

      {past.length > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-medium text-chalk">Past inspections</h2>
          <ul className="mt-3 divide-y divide-hairline rounded-card border border-hairline bg-surface">
            {past.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-chalk">{d.fileName}</span>
                <span className="font-mono text-xs text-ash">
                  {new Date(d.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ash/80">
            Saved to your vehicle records and fed to <Link href="/app/assistant" className="underline">Ask GloveBox</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
