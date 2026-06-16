const STEPS = [
  {
    n: "01",
    title: "Add your car",
    body: "Enter a VIN or your year, make, and model. About 30 seconds — no account needed just to look.",
  },
  {
    n: "02",
    title: "We get to work",
    body: "GloveBox pulls your service schedule, scans for open recalls, and reads typical local repair costs.",
  },
  {
    n: "03",
    title: "You stay ahead",
    body: "A quiet feed of what's due, what's been recalled, and whether a quote is fair — explained plainly.",
  },
];

/**
 * How it works (§7.5) — a genuine 3-step sequence, so numbered markers are
 * earned here. This is the ONLY place numbering belongs in the homepage.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="section scroll-mt-20 border-b border-hairline">
      <div className="container-gb">
        <span className="eyebrow">How it works</span>
        <h2 className="display-l mt-6 max-w-2xl text-chalk">
          From driveway to peace of mind.
        </h2>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-card border border-hairline bg-hairline md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-ink p-7 md:p-9">
              <span className="font-mono text-sm text-sage">{s.n}</span>
              <span aria-hidden className="ml-2 text-ash/40">
                ──
              </span>
              <h3 className="mt-5 text-xl font-medium text-chalk">{s.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ash">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
