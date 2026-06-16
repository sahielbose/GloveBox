"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  ShieldAlert,
  ReceiptText,
  Stethoscope,
  NotebookPen,
  Car,
  MessageCircleQuestion,
  Settings,
  LogOut,
} from "lucide-react";
import { GloveBoxMark } from "@/components/site/Logo";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/app/recalls", label: "Recall radar", icon: ShieldAlert },
  { href: "/app/quote-check", label: "Quote check", icon: ReceiptText },
  { href: "/app/symptoms", label: "Symptom decoder", icon: Stethoscope },
  { href: "/app/log", label: "Service log", icon: NotebookPen },
  { href: "/app/vehicle", label: "Vehicle", icon: Car },
  { href: "/app/assistant", label: "Ask GloveBox", icon: MessageCircleQuestion },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      <Link href="/app" className="mb-4 flex items-center gap-2 px-2 py-1">
        <GloveBoxMark className="size-6 text-sage" />
        <span className="text-[0.95rem] font-medium tracking-tight text-chalk">GloveBox</span>
      </Link>

      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-3 rounded-btn px-3 py-2 text-sm transition-colors",
              active ? "bg-surface text-chalk" : "text-ash hover:text-chalk hover:bg-surface/50",
            )}
          >
            <Icon size={16} aria-hidden />
            {l.label}
          </Link>
        );
      })}

      <form action={signOutAction} className="mt-auto">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-btn px-3 py-2 text-sm text-ash transition-colors hover:text-chalk hover:bg-surface/50"
        >
          <LogOut size={16} aria-hidden />
          Sign out
        </button>
      </form>
    </nav>
  );
}
