"use client";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Stat = { stat: string; title: string; body: string; attribution: string; href: string };

/**
 * Proof cards (§7.6) — a 2-up grid on desktop, a snap carousel with circular
 * prev/next controls + a progress bar on mobile.
 */
export function OpenSourceCards({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };
  const scrollByCard = (dir: number) => {
    ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <div className="mt-14">
      <div
        ref={ref}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {stats.map((s) => {
          const external = s.href.startsWith("http");
          return (
            <a
              key={s.title}
              href={s.href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group block min-w-[80%] shrink-0 snap-start rounded-card border border-hairline-l bg-paper p-7 transition-colors hover:border-cream-ink/25 sm:min-w-0 md:p-8"
            >
              <span className="stat block text-cream-ink">{s.stat}</span>
              <h3 className="mt-4 text-lg font-medium text-cream-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream-ink/70">{s.body}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs text-cream-ink/70 transition-colors group-hover:text-cream-ink">
                — {s.attribution}
              </span>
            </a>
          );
        })}
      </div>

      {/* Mobile-only controls + progress bar. */}
      <div className="mt-5 flex items-center gap-4 sm:hidden">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Previous card"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline-l text-cream-ink/70 transition-colors hover:text-cream-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          <ArrowLeft size={16} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Next card"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline-l text-cream-ink/70 transition-colors hover:text-cream-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
        >
          <ArrowRight size={16} aria-hidden />
        </button>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-cream-ink/10">
          <div className="h-full rounded-full bg-cream-ink/40 transition-[width]" style={{ width: `${20 + progress * 80}%` }} />
        </div>
      </div>
    </div>
  );
}
