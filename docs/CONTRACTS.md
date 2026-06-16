# GloveBox — build contracts for UI/page work

Read this before writing any page. Everything here already exists on disk and typechecks.
Do NOT modify shared files (app/layout.tsx, app/globals.css, tailwind.config.ts, lib/**, components/ui, components/cards, components/StatusBadge, components/site/Logo). Only create the files your track owns. Do NOT run git, the dev server, pnpm install, or db commands.

## Stack conventions (Next.js 16 App Router)
- Server Components by default. Add `"use client"` only for interactivity (forms with onChange, useState, useTransition).
- Route params/searchParams are async: `({ params }: { params: Promise<{id:string}> })` then `await params`.
- Authed pages live under `app/app/**`; the layout already gates auth + renders the sidebar + vehicle switcher. Each page should `export const dynamic = "force-dynamic"` (they read cookies/db).
- Mutations are **server actions** in a colocated `actions.ts` with `"use server"` at top. After a mutation, call `revalidatePath("/app/...")`.
- **Confirm gate (non-negotiable):** any action that SENDS, POSTS, SCHEDULES, EXPORTS, SHARES, or MESSAGES must require an explicit user confirm step in the UI (a distinct "Confirm & send" button / two-step). Never auto-send, auto-book, auto-pay, auto-submit. Drafting/preparing is fine; the human triggers the send.

## Auth + active vehicle
```ts
import { requireUser } from "@/lib/auth-helpers";        // -> { id, email, name? }; redirects if not signed in
import { getActiveVehicle } from "@/lib/app-context";    // -> { active: VehicleRow | null, vehicles: VehicleRow[] }
```
If `active` is null, show a friendly empty state linking to `/app/onboarding` ("Add your car").
VehicleRow fields: id, userId, vin, year, make, model, trim, engine, mileage, nickname, isPrimary, specs, createdAt.

## The verbs (`@/lib/services/*`) — all logic lives here, never reimplement in a component
```ts
import { checkQuote, parseEstimateText } from "@/lib/services/checkQuote";
// checkQuote({ vehicle, lineItems:{description,priceCents,laborHours?}[], region?, shopName? })
//   -> { verdict:"fair"|"high"|"overpriced", quotedTotalCents, fairLowCents, fairHighCents,
//        flags:{lineItem,reason,severity:"soon"|"alert",fairLowCents?,fairHighCents?}[],
//        lineItems:(annotated w/ matchedJob,itemFairLowCents,itemFairHighCents,priced)[],
//        provenance:string[], summary, disclaimer, llmUsed }
// parseEstimateText(text) -> { shopName:string|null, lineItems:{description,priceCents,laborHours?}[] }

import { decodeSymptom } from "@/lib/services/decodeSymptom";
// decodeSymptom({ text?, dtc?, vehicle }) -> { urgency:"safe"|"soon"|"stop", urgencyReason,
//   causes:{cause,likelihood:"high"|"medium"|"low",note?}[], costLowCents, costHighCents,
//   safetyCritical, dtcCode, summary, llmUsed }

import { findRecalls } from "@/lib/services/findRecalls";   // (vehicle, {includeCpscTires?}) -> RecallMatch[]
import { computeHealth } from "@/lib/services/computeHealth";
// computeHealth(vehicle, mileage, history:{type,jobKey?,mileage?,date?}[], now?)
//   -> { overall:"ok"|"soon"|"alert", counts:{ok,soon,alert}, items:MaintenanceItem[], disclaimer }
// MaintenanceItem: { service, category, status:"ok"|"soon"|"alert", dueMileage, dueDate(ISO|null),
//   intervalMiles, intervalMonths, jobKey, safetyCritical, note, reason }

import { decodeVehicle } from "@/lib/services/decodeVehicle";
// decodeVehicle({kind:"vin",vin,year?} | {kind:"ymm",year,make,model,trim?})
//   -> { vin, year, make, model, trim, engine, bodyClass, fuelType, mpg:{cityMpg,highwayMpg,combinedMpg}|null, specs, errors:string[], ok }

import { structureServiceEntry } from "@/lib/services/structureServiceEntry";
// (text, vehicle) -> { type, jobKey, description, date(ISO|null), mileage, parts:{name,partNumber?}[], laborHours, costCents, llmUsed }

import { generateRepairStory } from "@/lib/services/generateRepairStory";
// ({symptom,diagnosis,vehicle}) -> { complaint, cause, correction, llmUsed }

import { askVehicle } from "@/lib/services/askVehicle";
// ({question, vehicle:{...,id}, history?}) -> { answer, citations:{n,label,url,snippet,similarity}[], grounded, llmUsed }

import { draftShopMessage, draftBookingScript, buildGoogleCalendarLink, buildIcs } from "@/lib/services/sideEffects";
import { vehicleLabel, type Vehicle } from "@/lib/services/types";
```
To pass a VehicleRow to a verb, use `toVehicle(row)` from `@/lib/db/queries` (maps to the Vehicle shape with id).

## Persistence (`@/lib/db/queries`)
```ts
getUserVehicles, getVehicleForUser(userId,id), getPrimaryVehicle, createVehicle(userId,data),
updateVehicle(userId,id,data), deleteVehicle(userId,id), toVehicle(row),
addServiceRecord(vehicleId,{date:Date,mileage?,type,description?,parts?,laborHours?,costCents?,source?,receiptUrl?}),
listServiceRecords(vehicleId), deleteServiceRecord(vehicleId,id),
saveQuoteCheck(vehicleId,{shopName?,region?,lineItems,totalCents,verdict,fairLowCents,fairHighCents,flags,summary?}), listQuoteChecks(vehicleId),
saveSymptomReport(vehicleId,{input?,dtcCode?,causes,urgency,estLowCents?,estHighCents?,summary?}), listSymptomReports(vehicleId),
getRecallMatches(vehicleId), syncRecalls(vehicleId,vehicle) -> {all,fresh}, markRecallNotified(id),
addDocument(vehicleId,{kind,fileName?,fileUrl?,extractedText?}), listDocuments(vehicleId),
createReminder({vehicleId?,userId,kind,channel?,title,body?,scheduleAt:Date,status?,payload?}), listReminders(userId), updateReminderStatus(id,status),
getUser(userId), updateUserSettings(userId,{reminderChannel?,digestFrequency?,phone?,name?})
```
Money is integer cents everywhere. Reminders/exports start as `draft`/`scheduled` only after explicit confirm.

## UI kit + design tokens
```ts
import { Button, LinkButton, Card, Eyebrow, Chip, Field, inputClass, buttonClass } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";          // status:"ok"|"soon"|"alert", label?
import { QuoteCheckCard } from "@/components/cards/QuoteCheckCard";
import { RecallCard } from "@/components/cards/RecallCard";
import { SymptomCard } from "@/components/cards/SymptomCard";
import { formatMoney, formatMiles, cn } from "@/lib/utils";       // formatMoney(cents)
import { GloveBoxMark, Wordmark } from "@/components/site/Logo";
```
Tokens (Tailwind): bg-ink, bg-surface, text-chalk, text-ash, bg-bone, text-cream-ink, bg-sage text-ink (hover:bg-sage-hover), ok/warn/alert.
Borders: `border border-hairline`. Radii: rounded-card(12) / rounded-btn(8) / rounded-chip(6) / rounded-media(16).
Fonts: font-display (Fraunces serif headlines, thin), font-sans (Geist body), font-mono (VIN/prices/chips).
CSS helpers: `.eyebrow`, `.display-xl/.display-l/.display-m`, `.lead`, `.stat`, `.container-gb`, `.section`, `.chip`, `.marquee-track`.
**Status is ALWAYS icon + word, never color alone** (use StatusBadge). Headlines sentence case; eyebrows UPPERCASE.

## Card data shapes
- QuoteCheckCard `data`: { vehicleLabel, mileage?, shopName?, jobLabel?, totalCents, fairLowCents, fairHighCents, verdict, flags:{lineItem,reason,severity}[], provenance:string[] }
- RecallCard `data`: { severity, source:"NHTSA"|"CPSC", campaignId, component, summary, remedy, consequence?, status:"open"|"remedy_available"|"closed", provenanceUrl, parkIt?, parkOutside? } (+ optional `action` node)
- SymptomCard `data`: { input, urgency, urgencyReason?, causes:{cause,likelihood}[], costLowCents?, costHighCents?, dtcCode?, summary? }

## Guardrails to honor in copy
Informational, not a guarantee. Label pricing/maintenance as estimates ("confirm with a professional" / "confirm against your owner's manual"). Recalls show campaign ID + official source link, never invented. Never reassure about an unsafe symptom. No payment/credential handling anywhere.
