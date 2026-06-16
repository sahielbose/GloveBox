import Link from "next/link";

export const metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <span className="eyebrow justify-center">Magic link sent</span>
        <h1 className="display-m mt-6">Check your email</h1>
        <p className="mt-3 text-ash">
          We sent a one-time sign-in link to your inbox. It expires in 60 minutes and works once.
        </p>
        <p className="mt-6 text-sm text-ash">
          No email? It may be in spam — or, if you&apos;re running locally without a{" "}
          <code className="font-mono">RESEND_API_KEY</code>, the link was printed to your server
          console.
        </p>
        <Link href="/signin" className="mt-8 inline-block text-sm underline">
          ← Back to sign in
        </Link>
      </div>
    </main>
  );
}
