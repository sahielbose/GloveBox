"use client";

import { useActionState, useState } from "react";
import { Plus, X, AlertCircle, Flag, Upload } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui";
import { QuoteCheckCard } from "@/components/cards/QuoteCheckCard";
import { formatMoney, cn } from "@/lib/utils";
import { runQuoteCheck, type QuoteCheckState } from "./actions";

type RegionOption = { value: string; label: string };
type ManualRow = { id: number };

export function QuoteCheckForm({
  vehicleLabel,
  mileage,
  regions,
}: {
  vehicleLabel: string;
  mileage: number | null;
  regions: RegionOption[];
}) {
  const [state, formAction, pending] = useActionState<QuoteCheckState, FormData>(
    runQuoteCheck,
    null,
  );

  // Optional manual line items — start with none; owner can add rows.
  const [rows, setRows] = useState<ManualRow[]>([]);
  const [nextId, setNextId] = useState(1);
  const addRow = () => {
    setRows((r) => [...r, { id: nextId }]);
    setNextId((n) => n + 1);
  };
  const removeRow = (id: number) => setRows((r) => r.filter((x) => x.id !== id));

  const result = state?.ok ? state.result : null;

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6">
        <div className="rounded-card border border-hairline bg-surface p-5">
          <Field
            label="Paste the estimate"
            hint="Copy the line items straight from the shop's quote. We pull out each item and its price — we never invent one."
          >
            <textarea
              name="estimateText"
              rows={6}
              placeholder={
                "Front brake pads & rotors ......... $640\nBrake fluid flush ................. $120\nShop supplies ..................... $35"
              }
              className={cn(inputClass, "min-h-[8rem] resize-y font-mono text-sm")}
            />
          </Field>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-btn border border-hairline px-3 py-2 text-ash transition-colors hover:border-chalk/30 hover:text-chalk focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sage">
              <Upload size={15} aria-hidden />
              <span>Upload a photo or PDF of the estimate</span>
              <input type="file" name="estimateFile" accept="image/*,application/pdf,text/plain" className="sr-only" />
            </label>
            <span className="text-xs text-ash">or paste above</span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Shop name" hint="Optional — appears on the verdict and in your history.">
              <input
                name="shopName"
                type="text"
                placeholder="Downtown Auto"
                className={inputClass}
              />
            </Field>
            <Field label="Region" hint="Sets the local labor-rate band for the fair range.">
              <select name="region" defaultValue="" className={inputClass}>
                <option value="">U.S. national average</option>
                {regions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Optional manual line items */}
          <div className="mt-5 border-t border-hairline pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ash">Or add line items by hand</span>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 rounded-chip border border-hairline px-2.5 py-1 text-sm text-chalk transition-colors hover:border-chalk/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
              >
                <Plus size={14} aria-hidden /> Add item
              </button>
            </div>

            {rows.length > 0 && (
              <ul className="mt-4 space-y-3">
                {rows.map((row) => (
                  <li key={row.id} className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
                    <input
                      name="itemDescription"
                      type="text"
                      placeholder="Job or part (e.g. front brake pads)"
                      className={cn(inputClass, "sm:col-span-7")}
                    />
                    <input
                      name="itemPrice"
                      type="text"
                      inputMode="decimal"
                      placeholder="$ price"
                      className={cn(inputClass, "font-mono sm:col-span-2")}
                    />
                    <input
                      name="itemHours"
                      type="text"
                      inputMode="decimal"
                      placeholder="hrs"
                      aria-label="labor hours (optional)"
                      className={cn(inputClass, "font-mono sm:col-span-2")}
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label="Remove line item"
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-chip border border-hairline px-2 py-2 text-ash transition-colors hover:border-alert/40 hover:text-alert focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage sm:col-span-1"
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Checking…" : "Check this quote"}
            </Button>
            <span className="text-xs text-ash">
              Pricing is a labeled estimate from curated data — never an invented price.
            </span>
          </div>
        </div>
      </form>

      {state && !state.ok && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-card border border-alert/40 bg-alert/10 p-4 text-sm text-chalk"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-alert" aria-hidden />
          <span>{state.error}</span>
        </div>
      )}

      {result && (
        <section aria-label="Quote check result" className="space-y-5">
          {/* The signature verdict card */}
          <QuoteCheckCard
            data={{
              vehicleLabel,
              mileage,
              shopName: state?.ok ? state.shopName : null,
              totalCents: result.quotedTotalCents,
              fairLowCents: result.fairLowCents,
              fairHighCents: result.fairHighCents,
              verdict: result.verdict,
              flags: result.flags,
              provenance: result.provenance,
            }}
          />

          {/* Plain-English summary */}
          <div className="rounded-card border border-hairline bg-surface p-5">
            <span className="eyebrow">In plain English</span>
            <p className="mt-3 text-base leading-relaxed text-chalk">{result.summary}</p>
          </div>

          {/* Annotated line items */}
          <div className="rounded-card border border-hairline bg-surface p-5">
            <span className="eyebrow">Line by line</span>
            <ul className="mt-4 divide-y divide-hairline">
              {result.lineItems.map((item, i) => {
                const flagged = result.flags.some((f) => f.lineItem === item.description);
                return (
                  <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                    <div className="min-w-0">
                      <span className="text-sm text-chalk">
                        {item.description}
                        {flagged && (
                          <Flag
                            size={13}
                            className="ml-1.5 inline-block align-[-1px] text-warn"
                            aria-label="flagged"
                          />
                        )}
                      </span>
                      <div className="mt-0.5 text-xs text-ash">
                        {item.priced ? (
                          <>
                            {item.matchedJob ? `Matched: ${item.matchedJob} · ` : ""}
                            <span className="font-mono">
                              typical {formatMoney(item.itemFairLowCents)}–
                              {formatMoney(item.itemFairHighCents)}
                            </span>
                          </>
                        ) : (
                          <span>Not in our catalog — left as quoted, didn&apos;t affect the verdict.</span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-sm text-chalk">
                      {formatMoney(item.priceCents)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Disclaimer — pricing is a labeled estimate, never invented */}
          <p className="rounded-card border border-hairline bg-ink/40 p-4 text-xs leading-relaxed text-ash">
            {result.disclaimer}
          </p>
        </section>
      )}
    </div>
  );
}
