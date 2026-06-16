import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { Status } from "@/lib/status";
import { STATUS_VOCAB } from "@/lib/status";
import { cn } from "@/lib/utils";

const ICON = {
  ok: CheckCircle2,
  soon: Clock,
  alert: AlertTriangle,
} as const;

/**
 * Status pill — always icon + word, never color alone (a11y §9).
 * `label` overrides the default vocabulary word (e.g. "Open recall", "Stop driving").
 */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: Status;
  label?: string;
  className?: string;
}) {
  const meta = STATUS_VOCAB[status];
  const Icon = ICON[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-chip border px-2 py-0.5 text-sm font-medium",
        className,
      )}
      style={{
        color: meta.hex,
        borderColor: `${meta.hex}55`,
        background: `${meta.hex}14`,
      }}
    >
      <Icon size={14} aria-hidden />
      <span>{label ?? meta.label}</span>
    </span>
  );
}
