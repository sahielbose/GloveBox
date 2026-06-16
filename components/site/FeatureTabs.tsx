"use client";

import { useState } from "react";
import {
  CalendarClock,
  Radar,
  Receipt,
  Stethoscope,
  NotebookPen,
} from "lucide-react";
import { QuoteCheckCard } from "@/components/cards/QuoteCheckCard";
import { RecallCard } from "@/components/cards/RecallCard";
import { SymptomCard } from "@/components/cards/SymptomCard";
import { cn } from "@/lib/utils";

type TabKey =
  | "maintenance"
  | "recall"
  | "quote"
  | "symptom"
  | "log";

type Tab = {
  key: TabKey;
  name: string;
  icon: typeof Radar;
  copy: string;
  featured?: boolean;
};

const TABS: Tab[] = [
  {
    key: "maintenance",
    name: "Maintenance timeline",
    icon: CalendarClock,
    copy: "See what's due and when, tuned to your exact make, model, and mileage — not a generic 30k/60k chart.",
  },
  {
    key: "recall",
    name: "Recall radar",
    icon: Radar,
    copy: "We watch NHTSA, CPSC, and FDA so you don't have to. The moment something affecting your car is recalled, you'll know what it means and what to do.",
  },
  {
    key: "quote",
    name: "Quote check",
    icon: Receipt,
    featured: true,
    copy: "Paste a repair estimate and get a fair-price read for your make, model, and region — plus the line items worth questioning.",
  },
  {
    key: "symptom",
    name: "Symptom decoder",
    icon: Stethoscope,
    copy: "Describe a noise, smell, or warning light. Get the likely cause, how urgent it is, and a rough cost before you call the shop.",
  },
  {
    key: "log",
    name: "Service log",
    icon: NotebookPen,
    copy: "Every oil change, part, and receipt in one place. Export a clean history the day you sell.",
  },
];

/** Realistic, clearly-labeled demo data for the floating cards. */
function DemoCard({ tab }: { tab: TabKey }) {
  switch (tab) {
    case "quote":
      return (
        <QuoteCheckCard
          data={{
            vehicleLabel: "2018 BMW X5",
            mileage: 78400,
            shopName: "Downtown Auto",
            jobLabel: "front brake job",
            totalCents: 140000,
            fairLowCents: 48000,
            fairHighCents: 76000,
            verdict: "overpriced",
            flags: [
              {
                lineItem: "Rotor replacement ($420)",
                reason:
                  "Your pads are at 3 mm; rotors at this point are usually resurfaced, not replaced. Ask why.",
                severity: "soon",
              },
            ],
            provenance: ["parts catalog", "regional labor rates", "NHTSA TSB"],
          }}
        />
      );
    case "recall":
      return (
        <RecallCard
          data={{
            severity: "soon",
            source: "NHTSA",
            campaignId: "23V-XXX (example)",
            component: "Air bag inflator",
            summary:
              "An inflator in the driver's frontal air bag may rupture on deployment. This is an illustrative example — your real matches link straight to the official NHTSA notice.",
            consequence:
              "A ruptured inflator can send metal fragments toward occupants.",
            remedy: "Free replacement at any franchised dealer · about 2 hrs · schedule now.",
            status: "remedy_available",
            provenanceUrl: "https://www.nhtsa.gov/recalls",
          }}
        />
      );
    case "symptom":
      return (
        <SymptomCard
          data={{
            input: "grinding when I brake at low speed",
            urgency: "soon",
            urgencyReason:
              "Brakes are safety-critical. Safe to drive short-term, but get the front pads inspected soon.",
            causes: [
              { cause: "Worn front brake pads", likelihood: "high" },
              { cause: "Glazed or scored rotors", likelihood: "medium" },
              { cause: "Loose caliper hardware", likelihood: "low" },
            ],
            costLowCents: 25000,
            costHighCents: 40000,
            summary: "Likely worn front pads.",
          }}
        />
      );
    case "maintenance":
      return (
        <SymptomCard
          data={{
            input: "What's due at 78,400 miles?",
            urgency: "soon",
            urgencyReason:
              "Tuned to your exact make, model, and mileage — confirm against your owner's manual.",
            causes: [
              { cause: "Brake fluid flush — due now", likelihood: "high" },
              { cause: "Cabin air filter — due soon", likelihood: "medium" },
              { cause: "Spark plugs — ~22k miles out", likelihood: "low" },
            ],
            summary: "Three items on the horizon.",
          }}
        />
      );
    case "log":
      return (
        <QuoteCheckCard
          data={{
            vehicleLabel: "2018 BMW X5",
            mileage: 78400,
            shopName: "Service history",
            jobLabel: "oil & filter · synthetic",
            totalCents: 9800,
            fairLowCents: 7000,
            fairHighCents: 12000,
            verdict: "fair",
            flags: [],
            provenance: ["your receipt", "logged 2026-03-12", "exportable"],
          }}
        />
      );
  }
}

/**
 * Feature-tabs module (§7.4) — the centerpiece. A 2-up split: a vertical tab list
 * on the left (active row = chalk + sage tick; inactive = ash) and a calm dark
 * media panel on the right where the matching demo card floats. Switching
 * crossfades the panel and slides the card up a few px (motion §8).
 */
export function FeatureTabs() {
  const [active, setActive] = useState<TabKey>("quote");
  const activeTab = TABS.find((t) => t.key === active)!;

  return (
    <section className="section border-b border-hairline">
      <div className="container-gb">
        <span className="eyebrow">What it does</span>
        <h2 className="display-l mt-6 max-w-2xl text-chalk">
          Five quiet jobs, done for you.
        </h2>

        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
          {/* Tab list */}
          <div
            className="flex flex-col border-t border-hairline"
            role="tablist"
            aria-label="Features"
          >
            {TABS.map((tab) => {
              const isActive = tab.key === active;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  id={`feature-tab-${tab.key}`}
                  aria-selected={isActive}
                  aria-controls="feature-tabpanel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActive(tab.key)}
                  onKeyDown={(e) => {
                    const idx = TABS.findIndex((t) => t.key === tab.key);
                    let next = -1;
                    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (idx + 1) % TABS.length;
                    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (idx - 1 + TABS.length) % TABS.length;
                    else if (e.key === "Home") next = 0;
                    else if (e.key === "End") next = TABS.length - 1;
                    if (next >= 0) {
                      e.preventDefault();
                      setActive(TABS[next].key);
                      document.getElementById(`feature-tab-${TABS[next].key}`)?.focus();
                    }
                  }}
                  className={cn(
                    "group relative flex flex-col gap-1.5 border-b border-hairline py-5 pl-5 pr-3 text-left transition-colors",
                    isActive ? "text-chalk" : "text-ash hover:text-chalk",
                  )}
                >
                  {/* Sage left-tick on the active row. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-sage transition-opacity",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex items-center gap-2.5 text-base font-medium">
                    <tab.icon
                      size={17}
                      aria-hidden
                      className={isActive ? "text-sage" : "text-ash"}
                    />
                    {tab.name}
                    {tab.featured && (
                      <span className="rounded-chip border border-hairline px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wide text-ash">
                        Signature
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <span className="text-sm leading-relaxed text-ash">{tab.copy}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Media panel — calm dark gradient, card floats over it. */}
          <div
            role="tabpanel"
            id="feature-tabpanel"
            aria-labelledby={`feature-tab-${active}`}
            tabIndex={0}
            className="relative flex min-h-[26rem] items-center justify-center overflow-hidden rounded-media border border-hairline p-6 sm:p-10"
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(120% 80% at 70% 0%, rgba(142,155,121,0.10) 0%, transparent 55%)," +
                  "radial-gradient(100% 90% at 20% 100%, rgba(22,20,18,0.9) 0%, transparent 60%)," +
                  "linear-gradient(160deg, #161412 0%, #0C0B0A 100%)",
              }}
            />
            {/* key forces the crossfade + card-in slide on every tab change. */}
            <div key={active} className="w-full max-w-md animate-card-in">
              <DemoCard tab={active} />
            </div>
            <span className="sr-only">{activeTab.name} demo card</span>
          </div>
        </div>
      </div>
    </section>
  );
}
