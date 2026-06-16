import { requireUser } from "@/lib/auth-helpers";
import { getActiveVehicle } from "@/lib/app-context";
import { Eyebrow, LinkButton } from "@/components/ui";
import { vehicleLabel } from "@/lib/services/types";
import { Chat } from "./Chat";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const user = await requireUser();
  const { active } = await getActiveVehicle(user.id);

  // Empty state — no car yet. The assistant only answers from a car's own data.
  if (!active) {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <Eyebrow>Ask GloveBox</Eyebrow>
          <h1 className="display-m mt-2 font-display text-chalk">Ask about your car</h1>
        </header>
        <div className="rounded-card border border-hairline bg-surface p-8 text-center">
          <p className="text-chalk">Add a car to start asking questions.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ash">
            The assistant answers only from your car&apos;s own data — its recalls, maintenance
            schedule, saved quotes, and uploaded documents. It needs a car to ground its answers.
          </p>
          <div className="mt-5 flex justify-center">
            <LinkButton href="/app/onboarding">Add your car</LinkButton>
          </div>
        </div>
      </div>
    );
  }

  const label = active.nickname || vehicleLabel(active);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Eyebrow>Ask GloveBox</Eyebrow>
        <h1 className="display-m mt-2 font-display text-chalk">Ask about your car</h1>
        <p className="mt-2 max-w-2xl text-sm text-ash">
          A grounded assistant for{" "}
          <span className="font-mono text-chalk">{vehicleLabel(active)}</span>. Every answer is
          drawn from your car&apos;s own context with citations — informational, not a guarantee.
        </p>
      </header>

      <Chat carLabel={label} />
    </div>
  );
}
