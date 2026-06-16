import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Closing CTA (§7.7) — one quiet, centered ask on the warm-dark canvas, with a
 * soft sage pool of light behind the headline.
 */
export function ClosingCTA() {
  return (
    <section className="relative isolate overflow-hidden border-b border-hairline">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 120%, rgba(142,155,121,0.14) 0%, transparent 60%)",
        }}
      />
      <div className="container-gb section text-center">
        <h2 className="display-l mx-auto max-w-2xl text-chalk">
          Your car&rsquo;s whole story, in one place.
        </h2>

        <div className="mt-9 flex justify-center">
          <Link
            href="/app/onboarding"
            className="group inline-flex min-h-11 items-center gap-2 rounded-btn bg-sage px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-sage-hover"
          >
            Add your car
            <ArrowRight
              size={16}
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <p className="mt-6 text-sm text-ash">Free · open source · self-hostable</p>
      </div>
    </section>
  );
}
