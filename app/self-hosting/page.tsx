import type { Metadata } from "next";
import { ProsePage } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: "Self-hosting",
  description:
    "Run the whole of GloveBox on your own machine in one command. Your data, your box — with a free local fallback for voice and embeddings.",
};

export default function SelfHostingPage() {
  return (
    <ProsePage
      eyebrow="Self-hosting"
      title="Run the whole thing on your own machine"
      intro="GloveBox is built to be self-hosted from day one. One command brings up the app, the database, and the background-job runner. Your data never leaves your box."
      updated="June 2026"
    >
      <h2>One command</h2>
      <p>
        The repository ships a <code>docker-compose.yml</code> that boots the Next.js app, a
        Postgres instance with pgvector, and the Inngest dev server. Migrations and curated seed
        data are applied automatically on first start.
      </p>
      <pre>
        <code>{`git clone https://github.com/sahielbose/GloveBox
cd GloveBox
cp .env.example .env     # fill the four required keys (below)
docker compose up        # app + postgres(pgvector) + inngest`}</code>
      </pre>
      <p>
        The app comes up on <code>http://localhost:3000</code>. Prefer to run against an existing
        Postgres? Use <code>pnpm install &amp;&amp; pnpm db:push &amp;&amp; pnpm dev</code> instead.
      </p>

      <h2>Environment</h2>
      <p>Four keys are required to run; everything else is optional and degrades gracefully.</p>
      <ul>
        <li>
          <strong>DATABASE_URL</strong> — a Postgres connection string (pgvector enabled).
        </li>
        <li>
          <strong>AUTH_SECRET</strong> — generate with <code>openssl rand -base64 32</code>.
        </li>
        <li>
          <strong>ANTHROPIC_API_KEY</strong> — the core LLM for analysis and explanations.
        </li>
        <li>
          <strong>RESEND_API_KEY</strong> — magic-link sign-in emails and reminder digests.
        </li>
      </ul>
      <p>Optional keys unlock extra features but are never required:</p>
      <ul>
        <li>
          <strong>OPENAI_API_KEY</strong> — hosted Whisper speech-to-text and embeddings. Leave it
          blank to run local models instead (see below).
        </li>
        <li>
          <strong>STORAGE_*</strong> — S3-compatible storage for receipts and documents. Without it,
          uploads land in a local directory.
        </li>
        <li>
          <strong>TWILIO_*</strong> — SMS reminders. Without it, reminders are email-only.
        </li>
        <li>
          <strong>PRICING_API_KEY</strong> — an optional paid parts/labor provider. Without it, the
          curated pricing model runs.
        </li>
      </ul>

      <h2>Fully local, no cloud keys</h2>
      <p>
        To keep the self-host promise honest, voice capture and embeddings have free local fallbacks
        so you never have to hand data to a third party:
      </p>
      <ul>
        <li>
          <strong>Speech-to-text</strong> — run <code>whisper.cpp</code> locally for voice service
          entries instead of the hosted Whisper API.
        </li>
        <li>
          <strong>Embeddings</strong> — a small open embedding model writes to the same pgvector
          column the hosted model would, so Ask GloveBox and document RAG work offline.
        </li>
      </ul>
      <p>
        Both are selected by leaving the relevant cloud key blank. The only key you truly cannot
        avoid is the LLM provider, which sits behind a provider-agnostic client you can repoint.
      </p>

      <h2>Background jobs</h2>
      <p>
        Recall polling, maintenance digests, and scheduled reminders run on Inngest. The compose
        stack includes the dev server; in production, set <code>INNGEST_EVENT_KEY</code> and{" "}
        <code>INNGEST_SIGNING_KEY</code>. Daily recall polling and any outbound message are
        confirm-gated — nothing sends without your say-so.
      </p>

      <h2>Updating</h2>
      <p>
        Pull the latest, rebuild, and let migrations run on boot:
      </p>
      <pre>
        <code>{`git pull
docker compose build app
docker compose up`}</code>
      </pre>
      <p>
        Everything is MIT-licensed — fork it, change it, and run your fork. See the{" "}
        <a href="/license">license</a> and <a href="/docs">docs</a> for more.
      </p>
    </ProsePage>
  );
}
