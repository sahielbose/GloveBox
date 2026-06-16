import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { getCurrentUser } from "@/lib/auth-helpers";
import { emailEnabled } from "@/lib/integrations/email";

export const metadata = { title: "Sign in" };

async function signInAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  await signIn("email", { email, redirectTo: "/app" });
}

export default async function SignInPage() {
  const user = await getCurrentUser();
  if (user?.id) redirect("/app");

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="eyebrow">
          ← GloveBox
        </Link>
        <h1 className="display-m mt-6">Sign in</h1>
        <p className="mt-3 text-ash">
          We&apos;ll email you a one-time magic link — no password to remember.
        </p>

        <form action={signInAction} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm text-ash">Email</span>
            <input
              type="email"
              name="email"
              required
              autoFocus
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-btn border border-hairline bg-surface px-4 py-3 text-chalk placeholder:text-ash/60 focus:border-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-btn bg-sage px-5 py-3 font-medium text-ink transition-colors hover:bg-sage-hover"
          >
            Email me a sign-in link →
          </button>
        </form>

        {!emailEnabled() && (
          <p className="mt-6 rounded-card border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-chalk">
            <strong>Dev mode:</strong> no <code className="font-mono">RESEND_API_KEY</code> is set, so
            the magic link is printed to the server console instead of emailed. Check your terminal
            after submitting.
          </p>
        )}

        <p className="mt-8 text-sm text-ash">
          By continuing you agree to GloveBox being informational, not a guarantee — see the{" "}
          <Link href="/privacy" className="underline">
            privacy notice
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
