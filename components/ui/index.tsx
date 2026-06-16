import Link from "next/link";
import { cn } from "@/lib/utils";

/* Button styling shared by <button> and <Link>. */
export type ButtonVariant = "primary" | "ghost" | "contrast";

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-btn px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage disabled:opacity-50";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-sage text-ink hover:bg-sage-hover",
    ghost: "border border-hairline text-chalk hover:border-chalk/30",
    contrast: "bg-chalk text-ink hover:bg-chalk/90",
  };
  return cn(base, variants[variant], className);
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-card border border-hairline bg-surface p-5", className)}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("eyebrow", className)}>{children}</span>;
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("chip", className)}>{children}</span>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-ash">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-ash/80">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-btn border border-hairline bg-surface px-4 py-2.5 text-chalk outline-none placeholder:text-ash/60 focus:border-sage";
