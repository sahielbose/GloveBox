import Link from "next/link";
import { GitFork } from "lucide-react";
import { Wordmark } from "@/components/site/Logo";

const REPO_URL = "https://github.com/sahielbose/GloveBox";

const COLUMNS: { heading: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Recalls", href: "/recalls" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    heading: "Developers",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Self-hosting", href: "/self-hosting" },
      { label: "GitHub", href: REPO_URL, external: true },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "License (MIT)", href: "/license" },
      { label: "Privacy", href: "/privacy" },
      { label: "Security", href: "/security" },
    ],
  },
];

/**
 * Footer (§7.8) — three link columns + a legal row, closed by a giant low-contrast
 * "GloveBox" Fraunces watermark clipped at the bottom edge. The watermark is
 * decorative (the real wordmark is in the column header).
 */
export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-ink">
      <div className="container-gb pb-44 pt-20 md:pb-52">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex text-chalk" aria-label="GloveBox home">
              <Wordmark />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ash">
              The calm, plain-spoken assistant for the car already in your driveway.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-ash">
                {col.heading}
              </h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-chalk/80 transition-colors hover:text-chalk"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-chalk/80 transition-colors hover:text-chalk"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-7">
          <p className="text-sm text-ash">
            © 2026 GloveBox · MIT Licensed · Made in the open.
          </p>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-11 items-center justify-center rounded-btn border border-hairline text-ash transition-colors hover:border-chalk/30 hover:text-chalk"
            aria-label="GloveBox on GitHub"
          >
            <GitFork size={18} aria-hidden />
          </a>
        </div>
      </div>

      {/* Oversized watermark, clipped at the bottom edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 select-none translate-y-[28%] text-center font-display font-light leading-none text-chalk/[0.04]"
        style={{ fontSize: "clamp(5rem, 22vw, 18rem)", letterSpacing: "-0.03em" }}
      >
        GloveBox
      </span>
    </footer>
  );
}
