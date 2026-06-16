import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getUser } from "@/lib/db/queries";
import { Eyebrow } from "@/components/ui";
import { RemindersForm, DataExport, DeleteAccount } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const account = await getUser(user.id);

  // Fall back to schema defaults if the row is somehow missing.
  const settings = {
    reminderChannel: account?.reminderChannel ?? "email",
    digestFrequency: account?.digestFrequency ?? "weekly",
    phone: account?.phone ?? null,
  };

  return (
    <div className="flex flex-col gap-10">
      <header>
        <Eyebrow>Settings</Eyebrow>
        <h1 className="display-m mt-2 font-display text-chalk">Settings</h1>
        <p className="mt-2 text-sm text-ash">
          {account?.email ? (
            <>
              Signed in as <span className="font-mono text-chalk">{account.email}</span>.
            </>
          ) : (
            "Your account preferences."
          )}
        </p>
      </header>

      {/* Reminders & channels */}
      <Section
        title="Reminders & channels"
        description="Email is the default. SMS requires Twilio configured on the server — without it, reminders degrade to email."
      >
        <RemindersForm user={settings} />
      </Section>

      {/* Data export */}
      <Section
        title="Your data"
        description="Export a full copy of everything GloveBox holds for you."
      >
        <DataExport />
        <p className="mt-4 text-sm text-ash">
          Just want your service history?{" "}
          <Link
            href="/app/log"
            className="text-sage hover:text-sage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
          >
            Export it as CSV from the service log
          </Link>
          .
        </p>
      </Section>

      {/* Privacy & self-host */}
      <Section title="Privacy & self-hosting">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 rounded-card border border-hairline bg-surface p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-sage" aria-hidden />
            <p className="text-sm text-ash">
              Your <span className="text-chalk">VIN and location</span> are sensitive. We store them
              minimally, keep them out of URLs, and{" "}
              <span className="text-chalk">never sell or share</span> your data. GloveBox is
              open-source and fully self-hostable — run the whole thing on your own machine and keep
              every byte in your own box.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/self-hosting"
              className="inline-flex items-center gap-1.5 text-sage hover:text-sage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            >
              Self-hosting guide <ArrowRight size={14} aria-hidden />
            </Link>
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 text-sage hover:text-sage-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            >
              Privacy notice <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Danger zone">
        <DeleteAccount />
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="text-lg font-medium text-chalk">{title}</h2>
      {description && <p className="mt-1.5 max-w-2xl text-sm text-ash">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
