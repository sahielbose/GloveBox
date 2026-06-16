import type { Metadata } from "next";
import { ProsePage } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "What GloveBox does, the verbs it runs, the public data sources behind it, and how to run it locally.",
};

export default function DocsPage() {
  return (
    <ProsePage
      eyebrow="Documentation"
      title="What GloveBox is, and how it works"
      intro="GloveBox is an open-source car-ownership assistant for the car already in your driveway. Track maintenance, watch every recall, sanity-check repair quotes, decode symptoms, and keep a clean service history — all explained in plain English."
      updated="June 2026"
    >
      <h2>What it does</h2>
      <p>
        GloveBox points the kind of intelligence a dealership has at the individual owner&rsquo;s
        car. You describe what&rsquo;s happening — by voice or text — and get a structured record,
        a clear answer, and an honest estimate. Everything is informational, with ranges and
        provenance, not a guarantee.
      </p>

      <h2>The verbs</h2>
      <p>All the real logic lives in a small set of typed services. Each takes a vehicle and returns a validated result:</p>
      <ul>
        <li>
          <strong>Add your car</strong> — decode a VIN or a year/make/model entry into a canonical
          vehicle profile.
        </li>
        <li>
          <strong>Maintenance timeline</strong> — what&rsquo;s due and when, tuned to your exact make,
          model, and mileage. Estimates are labeled &ldquo;confirm against your owner&rsquo;s manual.&rdquo;
        </li>
        <li>
          <strong>Recall radar</strong> — match open recalls from official feeds, with the campaign
          ID, plain-English impact, and the remedy.
        </li>
        <li>
          <strong>Quote check</strong> — paste a repair estimate and get a fair-price range for your
          car and region, plus the line items worth questioning.
        </li>
        <li>
          <strong>Symptom decoder</strong> — describe a noise, smell, or warning light (or enter a DTC
          code) and get the likely cause, how urgent it is, and a rough cost.
        </li>
        <li>
          <strong>Service log</strong> — capture every oil change, part, and receipt; export a clean
          history when you sell.
        </li>
        <li>
          <strong>Ask GloveBox</strong> — a grounded chat over your car&rsquo;s context and uploaded
          documents, with citations.
        </li>
      </ul>

      <h2>Where the data comes from</h2>
      <p>
        GloveBox builds on free, public, US-first sources — no scraping of closed catalogs, no
        invented numbers:
      </p>
      <ul>
        <li>
          <strong>NHTSA</strong> — VIN decoding (vPIC), vehicle recalls, safety ratings, and owner
          complaints.
        </li>
        <li>
          <strong>CPSC</strong> — product recalls for tires, child seats, and accessories.
        </li>
        <li>
          <strong>FuelEconomy.gov</strong> — vehicle data and EPA fuel-economy figures.
        </li>
        <li>
          <strong>SAE OBD-II codes</strong> — a seeded code-to-meaning table for the symptom decoder.
        </li>
      </ul>
      <p>
        Two areas have no clean free API, so GloveBox ships <strong>curated seed data</strong>,
        clearly labeled as estimates: common maintenance intervals, and a parts/labor pricing model
        (standard labor hours × regional rates × parts ranges). A paid provider can be swapped in
        later, but the free model is the default.
      </p>

      <h2>Quickstart</h2>
      <p>
        GloveBox runs anywhere Docker does. Copy the example environment, fill the four required
        keys, and bring the stack up:
      </p>
      <pre>
        <code>{`cp .env.example .env   # DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY, RESEND_API_KEY
docker compose up      # app + Postgres (pgvector) + Inngest dev`}</code>
      </pre>
      <p>
        Prefer running against your own Postgres? Use <code>pnpm install &amp;&amp; pnpm db:push &amp;&amp; pnpm dev</code>.
        The full setup, including optional keys and self-hosting notes, lives in the{" "}
        <a href="https://github.com/sahielbose/GloveBox#readme" target="_blank" rel="noopener noreferrer">
          README
        </a>{" "}
        and the <a href="/self-hosting">self-hosting guide</a>.
      </p>

      <h2>A note on accuracy</h2>
      <p>
        Quote Check and the Symptom Decoder give estimates with ranges and provenance, plus
        &ldquo;confirm with a professional.&rdquo; Urgency always errs toward caution for safety-critical
        systems — brakes, steering, overheating, airbags, tires. Recalls come only from official
        feeds, with a campaign ID and source link. GloveBox never handles payment or credentials.
      </p>
    </ProsePage>
  );
}
