import Link from "next/link";
import { ArrowRight } from "lucide-react";

const REPO_URL = "https://github.com/sahielbose/GloveBox";

/**
 * Hero (§7.1) — warm-dark, full-bleed. The background is a calm CSS gradient
 * vignette (no hotlinked imagery): a soft pool of light low-left over the warm
 * near-black canvas, suggesting a dim garage / dashboard at dusk. The single
 * <h1> of the page lives here.
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Decorative background — pure CSS, marked decorative for a11y. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 18% 110%, rgba(142,155,121,0.16) 0%, rgba(142,155,121,0.05) 28%, transparent 60%)," +
              "radial-gradient(90% 70% at 85% -10%, rgba(216,162,74,0.07) 0%, transparent 55%)",
          }}
        />
        {/* Faint instrument-panel hairline grid, fading to nothing. */}
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(244,241,235,0.035) 1px, transparent 1px)," +
              "linear-gradient(to bottom, rgba(244,241,235,0.035) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(80% 70% at 50% 30%, black, transparent 75%)",
            WebkitMaskImage: "radial-gradient(80% 70% at 50% 30%, black, transparent 75%)",
          }}
        />
        {/* Bottom vignette for legibility + a clean handoff to the marquee. */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
      </div>

      <div className="container-gb pb-24 pt-40 sm:pt-44 md:pb-32 md:pt-52">
        <div className="max-w-3xl">
          <span className="eyebrow animate-fade-up [animation-delay:60ms]">
            Open source · MIT
          </span>

          <h1 className="display-xl mt-7 animate-fade-up text-chalk [animation-delay:120ms]">
            Everything your glovebox should know.
          </h1>

          <p className="lead mt-6 max-w-xl animate-fade-up text-ash [animation-delay:200ms]">
            GloveBox tracks your maintenance, watches every recall, and
            sanity-checks repair quotes — then tells you, in plain English,
            what&rsquo;s actually worth doing.
          </p>

          <div className="mt-10 flex animate-fade-up flex-wrap items-center gap-4 [animation-delay:280ms]">
            <Link
              href="/app/onboarding"
              className="group inline-flex min-h-11 items-center gap-2 rounded-btn bg-sage px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-sage-hover"
            >
              Add your car
              <ArrowRight
                size={16}
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-11 items-center gap-2 rounded-btn border border-hairline px-5 py-3 text-sm font-medium text-chalk transition-colors hover:border-chalk/30"
            >
              View on GitHub
              <ArrowRight
                size={16}
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
