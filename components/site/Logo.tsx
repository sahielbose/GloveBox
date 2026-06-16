import { cn } from "@/lib/utils";

/**
 * GloveBox mark — a monoline glyph that reads as a glovebox latch / compartment
 * and a hex fastener. Single-weight, legible at 24px, works in one color.
 */
export function GloveBoxMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("size-6", className)} aria-hidden>
      <path
        d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 11.5h8v4H8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10.5 11.5v-1a1.5 1.5 0 0 1 3 0v1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <GloveBoxMark />
      <span className="text-[0.95rem] font-medium tracking-tight">GloveBox</span>
    </span>
  );
}
