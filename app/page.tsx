import Link from "next/link";

// Minimal boot homepage. The marketing track replaces this with the full
// sectioned editorial homepage (Nav, Hero, DataMarquee, FeatureTabs, …).
export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="section">
        <div className="container-gb">
          <span className="eyebrow">Open source · MIT</span>
          <h1 className="display-xl mt-8 max-w-3xl">
            Everything your glovebox should know.
          </h1>
          <p className="lead mt-6 max-w-xl text-ash">
            GloveBox tracks your maintenance, watches every recall, and
            sanity-checks repair quotes — then tells you, in plain English,
            what&apos;s actually worth doing.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/app/onboarding"
              className="rounded-btn bg-sage px-5 py-3 font-medium text-ink transition-colors hover:bg-sage-hover"
            >
              Add your car
            </Link>
            <Link
              href="/recalls"
              className="rounded-btn border border-hairline px-5 py-3 font-medium text-chalk transition-colors hover:border-chalk/30"
            >
              Look up a recall →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
