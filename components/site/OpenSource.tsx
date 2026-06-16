import { GithubStars } from "@/components/site/GithubStars";

const REPO_URL = "https://github.com/sahielbose/GloveBox";

const STATS = [
  {
    stat: "MIT",
    title: "Licensed",
    body: "Fork it, ship it, run it on your own machine. No closed core, no strings.",
    attribution: "github.com/sahielbose/GloveBox",
    href: REPO_URL,
  },
  {
    stat: "One command",
    title: "Self-hostable",
    body: "docker compose up and it's yours — your data, your box, your keys.",
    attribution: "Self-hosting guide",
    href: "/self-hosting",
  },
  {
    stat: "US-wide",
    title: "Coverage",
    body: "Recalls and VIN decoding for every US make and model, straight from NHTSA and CPSC.",
    attribution: "Public safety feeds",
    href: "/docs",
  },
  {
    stat: "$0",
    title: "Forever",
    body: "No subscription. No upsell. No data resale. The whole product, free.",
    attribution: "Our open-source promise",
    href: "/license",
  },
];

/**
 * Built in the open (§7.6) — the bone light block that breaks the dark rhythm.
 * Big-stat cards on paper with cream-ink text. No fake testimonials or customer
 * counts; this is the open-source promise plus a real GitHub star pill.
 */
export function OpenSource() {
  return (
    <section className="bg-bone text-cream-ink">
      <div className="container-gb section">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow !text-cream-ink/60">Open source</span>
            <h2 className="display-l mt-6 max-w-2xl text-cream-ink">
              Built in the open — and free, forever.
            </h2>
          </div>
          {/* Real GitHub numbers only; the pill degrades to "GitHub" if the
              fetch fails. Styled for the light section. */}
          <div className="[&_a]:border-cream-ink/15 [&_a]:text-cream-ink/70 [&_a:hover]:border-cream-ink/30 [&_a:hover]:text-cream-ink">
            <GithubStars />
          </div>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {STATS.map((s) => {
            const external = s.href.startsWith("http");
            return (
              <a
                key={s.title}
                href={s.href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group block rounded-card border border-hairline-l bg-paper p-7 transition-colors hover:border-cream-ink/25 md:p-8"
              >
                <span className="stat block text-cream-ink">{s.stat}</span>
                <h3 className="mt-4 text-lg font-medium text-cream-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-ink/70">{s.body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs text-cream-ink/55 transition-colors group-hover:text-cream-ink/80">
                  — {s.attribution}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
