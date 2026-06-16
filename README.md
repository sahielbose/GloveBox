# GloveBox

**Everything your glovebox should know.** An open-source, self-hostable car-ownership assistant: track maintenance, watch every recall, sanity-check repair quotes, decode warning lights, and keep a full service history — explained in plain English.

GloveBox maps the capabilities of a dealership AI onto the individual car owner, built entirely on **free public data** (NHTSA, CPSC, FuelEconomy.gov) with **original branding, copy, and design**.

> **Informational, not a guarantee.** Pricing and maintenance figures are clearly-labeled estimates from curated data — confirm with a professional / your owner's manual. Recalls come only from official NHTSA/CPSC feeds with the campaign ID and source link. GloveBox never auto-pays, auto-books, or handles credentials — it drafts, you send.

---

## Features

- **Quote Check ★** — paste a repair estimate, get a fair-price verdict for your make/model/region plus the line items worth questioning. Pricing is a deterministic curated model (labor-time × regional rate + parts range); the LLM never invents a price.
- **Recall Radar** — official NHTSA/CPSC recalls matched to your car, with severity, remedy, campaign ID, and a "Prep visit" booking-script draft. A daily background job re-checks and emails new matches.
- **Maintenance timeline** — what's due by exact mileage and time, from a curated interval dataset (labeled estimates).
- **Symptom Decoder** — describe a noise/smell/warning light or enter a DTC → likely cause, urgency (safe / soon / **stop driving**), and rough cost. Safety-biased: brakes, steering, overheating, airbags, tires, and oil are never under-warned.
- **Service Log** — add entries by voice or text (auto-structured), attach receipts, export a clean CSV/PDF history.
- **Ask GloveBox** — grounded Q&A over your car's own context (schedules, cached recalls, your uploaded docs) with citations; it declines rather than invent.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind · Postgres + pgvector · Drizzle · Auth.js (email magic-link) · Inngest (jobs) · Anthropic Claude (behind a provider-agnostic client) · Whisper STT · Resend email. The LLM, embeddings, STT, and email all **degrade gracefully** when their keys are absent, so the app runs and self-hosts without paid services.

## Quickstart — clone → running

### Option A: Docker (the whole stack)

```bash
git clone https://github.com/sahielbose/GloveBox.git
cd GloveBox
cp .env.example .env        # fill the 4 required keys (see below); AUTH_SECRET via: openssl rand -base64 32
docker compose up           # boots app + postgres(pgvector) + inngest dev
```

Open http://localhost:3000. On first boot the DB is migrated and seeded with an explorable demo car — **sign in as `demo@glovebox.local`** (without a `RESEND_API_KEY`, the magic link prints to the `app` container logs).

### Option B: Local dev (against your own Postgres + pgvector)

```bash
pnpm install
cp .env.example .env        # set DATABASE_URL + AUTH_SECRET (4 required keys below)
pnpm db:migrate             # creates the vector extension + tables
pnpm db:seed                # optional: demo account
pnpm dev                    # http://localhost:3000
pnpm inngest                # (separate terminal) Inngest dev server for background jobs
```

The easiest pgvector for local dev:

```bash
docker run -d --name gb-pg -e POSTGRES_USER=glovebox -e POSTGRES_PASSWORD=glovebox \
  -e POSTGRES_DB=glovebox -p 5432:5432 pgvector/pgvector:pg16
# DATABASE_URL=postgresql://glovebox:glovebox@localhost:5432/glovebox
```

### Required environment

Only **four** vars are required to run; everything else is optional and degrades gracefully (see `.env.example`).

| Var | Purpose | Without it |
|---|---|---|
| `DATABASE_URL` | Postgres + pgvector | required |
| `AUTH_SECRET` | session signing (`openssl rand -base64 32`) | required |
| `ANTHROPIC_API_KEY` | Claude (explanations, extraction, assistant) | deterministic offline fallbacks; trust-critical verbs still work |
| `RESEND_API_KEY` | magic-link + digest email | magic links print to the server console |

Optional: `OPENAI_API_KEY` (Whisper voice + better embeddings — else local fallback), storage S3 creds (else local `./storage`), Twilio (SMS — else email), `INNGEST_*` (prod jobs), `PRICING_API_KEY` (paid pricing swap — else curated model).

## Commands

```bash
pnpm dev          # Next.js dev server
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm evals        # run the trust-layer golden sets (Quote Check, symptom urgency, recall match, …)
pnpm db:migrate   # apply migrations (ensures pgvector extension first)
pnpm db:seed      # seed the demo account
pnpm inngest      # local Inngest dev server
```

## The trust layer (`/evals`)

The credibility-critical verbs are eval-gated. `pnpm evals` runs golden sets and fails if a gating suite drops below threshold:

- **Quote Check** — verdict accuracy + flag recall.
- **Symptom urgency** — asymmetric: under-warning a safety-critical case is a **hard failure**.
- **Service-entry extraction** — deterministic field accuracy.
- **Recall match / VIN decode** — live against NHTSA/vPIC (skips cleanly offline; a missed known campaign is a safety miss).

## Architecture

All real logic lives in `lib/services` as typed, zod-validated **verbs** (`checkQuote`, `decodeSymptom`, `findRecalls`, `computeHealth`, `decodeVehicle`, `structureServiceEntry`, `generateRepairStory`, `askVehicle`, …). The UI and the Inngest jobs call the verbs — never the reverse. Pricing/intervals/DTC data is curated in `/data` and clearly labeled as estimates. See `docs/CONTRACTS.md` for the full interface map.

```
app/            routes — marketing (/, /recalls, /docs…) + app (/app/*) + api
components/     site/ (homepage)  app/ (shell)  cards/ (signature family)  ui/
lib/services    the verbs (pure, typed, zod-validated)
lib/integrations  nhtsa · cpsc · fueleconomy · stt · email · storage · http
lib/llm         provider-agnostic client (Claude) + structured extraction
lib/rag         chunk · embed (OpenAI or local fallback) · pgvector retrieve
lib/jobs        inngest: recall.poll · maintenance.digest · reminder.fire
lib/db          drizzle schema · client · migrate · seed · queries
data/           curated labor times · regional rates · parts ranges · intervals · DTC seed
evals/          golden sets + runner
```

## Safety, privacy & licensing

- **Safety bias** on symptom urgency; never reassures about a clearly unsafe condition.
- **Recall integrity** — official feeds only, never fabricated, never marked resolved without official status.
- **Confirm gates** — anything that sends/posts/schedules/exports/shares is an explicit user action. No auto-pay/book/submit; no credential or payment handling.
- **Privacy** — VIN/location are sensitive; stored minimally, kept out of URLs, never sold. Fully self-hostable.
- **License — [MIT](LICENSE).** Built in the open.

---

*GloveBox is an independent open-source project. It is not affiliated with NHTSA, CPSC, or any vehicle manufacturer. "Repair Order Story" and similar industry terms describe generic capabilities.*
