const SOURCES = [
  "NHTSA",
  "CPSC",
  "FDA",
  "vPIC VIN decode",
  "FuelEconomy.gov",
  "NHTSA Complaints",
  "SAE OBD-II codes",
];

/**
 * Data-source marquee (§7.2) — an honest "where the data comes from" row in place
 * of a "trusted partners" wall. Clean Geist text wordmarks (safer than agency
 * logos), greyscale, brightening on hover. The track is duplicated so the
 * -50% translate loop is seamless; globals.css pauses it on hover and disables
 * it under prefers-reduced-motion.
 */
export function DataMarquee() {
  return (
    <section className="border-y border-hairline bg-ink py-10">
      <div className="container-gb">
        <span className="eyebrow">Powered by public safety data</span>
      </div>

      <div className="marquee-mask relative mt-7 overflow-hidden">
        {/* Edge fades so wordmarks dissolve rather than clip. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent sm:w-28"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent sm:w-28"
        />

        <div className="marquee-track">
          {[0, 1].map((dup) => (
            <ul
              key={dup}
              className="flex shrink-0 items-center"
              aria-hidden={dup === 1}
            >
              {SOURCES.map((s) => (
                <li
                  key={`${dup}-${s}`}
                  className="flex items-center whitespace-nowrap px-7 text-base font-medium tracking-tight text-ash transition-colors hover:text-chalk sm:px-10"
                >
                  {s}
                  <span aria-hidden className="ml-7 text-ash/25 sm:ml-10">
                    ·
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
