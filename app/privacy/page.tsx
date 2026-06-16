import type { Metadata } from "next";
import { ProsePage } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How GloveBox handles your data: VINs and location are treated as sensitive, stored minimally, never sold, and fully yours to self-host.",
};

export default function PrivacyPage() {
  return (
    <ProsePage
      eyebrow="Privacy"
      title="Your car's data is yours"
      intro="Plain-language privacy, no dark patterns. GloveBox is designed to know as little about you as it can while still being useful — and to let you run the whole thing yourself if you'd rather we knew nothing at all."
      updated="June 2026"
    >
      <h2>What we treat as sensitive</h2>
      <p>
        A VIN, your location, and your service history can identify you and your vehicle. We treat
        them as sensitive: they&rsquo;re stored minimally, kept out of URLs and logs where possible,
        and never used for advertising.
      </p>

      <h2>What we store, and why</h2>
      <ul>
        <li>
          <strong>Your vehicle profile</strong> — VIN or year/make/model, mileage, and specs — so we
          can match recalls and tune maintenance to your exact car.
        </li>
        <li>
          <strong>Your records</strong> — service entries, quote checks, symptom reports, and uploaded
          documents you choose to add — so your history is in one place.
        </li>
        <li>
          <strong>Your account</strong> — an email address for magic-link sign-in. We never store
          passwords.
        </li>
      </ul>

      <h2>What we never do</h2>
      <ul>
        <li>
          <strong>We never sell or share your data.</strong> No data brokers, no ad networks, no
          &ldquo;partners.&rdquo;
        </li>
        <li>
          <strong>We never handle payment or credentials.</strong> GloveBox does not collect card
          numbers, bank logins, or dealer-account passwords. Ever.
        </li>
        <li>
          <strong>We never auto-send on your behalf.</strong> Reminders, exports, and shop messages
          are drafted and require an explicit confirm step before anything leaves.
        </li>
      </ul>

      <h2>Documents and AI</h2>
      <p>
        Documents you upload (manuals, insurance, registrations) are used to answer questions about
        your car and are stored encrypted at rest where the deployment supports it. The LLM sees only
        the context needed to answer; it doesn&rsquo;t train on your data.
      </p>

      <h2>Your controls</h2>
      <ul>
        <li>
          <strong>Export</strong> — download a clean copy of your service history any time (PDF or CSV).
        </li>
        <li>
          <strong>Delete</strong> — remove a vehicle or your whole account; deletion removes your
          records.
        </li>
        <li>
          <strong>Self-host</strong> — run GloveBox on your own machine so none of this data ever
          touches our servers. See the <a href="/self-hosting">self-hosting guide</a>.
        </li>
      </ul>

      <h2>Third-party data sources</h2>
      <p>
        To match recalls and decode vehicles, we query public government APIs (NHTSA, CPSC,
        FuelEconomy.gov) using your VIN or year/make/model. These are official, free, public
        services; we send only what&rsquo;s needed to get a result and don&rsquo;t share your identity
        with them.
      </p>

      <p>
        Questions about privacy? Open an issue on{" "}
        <a href="https://github.com/sahielbose/GloveBox" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>{" "}
        — the code is open, so you can verify any of the above yourself.
      </p>
    </ProsePage>
  );
}
