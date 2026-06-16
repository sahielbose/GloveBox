import { MessageSquareText, Lock, RefreshCw } from "lucide-react";

const CAPS = [
  {
    icon: MessageSquareText,
    label: "Plain-English",
    body: "Every alert explained like a friend who happens to be a mechanic — no jargon, no fear-mongering.",
  },
  {
    icon: Lock,
    label: "Private by default",
    body: "Your car's history stays yours. Self-host the whole thing in one command; we never sell or share your data.",
  },
  {
    icon: RefreshCw,
    label: "Always current",
    body: "Recalls and service schedules refresh in the background, automatically — straight from official feeds.",
  },
];

/**
 * Features intro + three capabilities (§7.3). A set, not a sequence — so there is
 * deliberately no numbering here (numbering is reserved for How it works).
 */
export function Capabilities() {
  return (
    <section id="features" className="section scroll-mt-20 border-b border-hairline">
      <div className="container-gb">
        <span className="eyebrow">Features</span>
        <h2 className="display-l mt-6 max-w-2xl text-chalk">Built around your car.</h2>

        <div className="mt-14 grid gap-px overflow-hidden rounded-card border border-hairline bg-hairline sm:grid-cols-3">
          {CAPS.map(({ icon: Icon, label, body }) => (
            <div key={label} className="bg-ink p-7 md:p-8">
              <div className="flex size-11 items-center justify-center rounded-btn border border-hairline text-sage">
                <Icon size={20} aria-hidden />
              </div>
              <h3 className="mt-5 text-lg font-medium text-chalk">{label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ash">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
