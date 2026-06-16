"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/site/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/recalls", label: "Recalls" },
  { href: "/docs", label: "Docs" },
];

/**
 * Sticky nav — transparent over the hero; gains a blurred ink background + bottom
 * hairline after ~40px of scroll (motion §8). The GitHub star pill is passed in as
 * a slot so this client component can stay free of the server-side star fetch.
 */
export function Nav({ stars }: { stars?: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || open
          ? "border-b border-hairline bg-ink/85 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <nav className="container-gb flex h-16 items-center justify-between gap-4" aria-label="Primary">
        <Link href="/" className="flex items-center text-chalk" aria-label="GloveBox home">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-ash transition-colors hover:text-chalk"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {stars}
          <Link
            href="/app/onboarding"
            className="inline-flex min-h-11 items-center rounded-btn bg-sage px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-sage-hover"
          >
            Add your car
          </Link>
        </div>

        {/* Mobile: keep the CTA visible, collapse links into a sheet. */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/app/onboarding"
            className="inline-flex min-h-11 items-center rounded-btn bg-sage px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-sage-hover"
          >
            Add your car
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-11 items-center justify-center rounded-btn border border-hairline text-chalk"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-hairline bg-ink/95 backdrop-blur-md md:hidden">
          <div className="container-gb flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center text-base text-chalk"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-3 border-t border-hairline pt-4">
              {stars}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
