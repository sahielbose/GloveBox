import type { Metadata } from "next";
import { ProsePage } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Where GloveBox is headed — optional paid data swaps, plate lookup, SMS reminders, and calendar sync. The free, self-hostable core stays free.",
};

export default function RoadmapPage() {
  return (
    <ProsePage
      eyebrow="Roadmap"
      title="Where GloveBox is headed"
      intro="The free, self-hostable core is the product, and it stays that way. Most of what's ahead is optional upgrades — paid data sources you can swap in — and a few conveniences. Honest about what's shipped and what isn't."
      updated="June 2026"
    >
      <h2>Shipped today</h2>
      <ul>
        <li>VIN and year/make/model onboarding, backed by NHTSA vPIC.</li>
        <li>Maintenance timeline from curated, labeled-estimate intervals.</li>
        <li>Recall radar across NHTSA and CPSC, with daily polling.</li>
        <li>Quote Check with a curated parts/labor pricing model.</li>
        <li>Symptom decoder with safety-biased urgency.</li>
        <li>Service log with voice and text capture, plus PDF/CSV export.</li>
        <li>Ask GloveBox — grounded answers with citations.</li>
      </ul>

      <h2>Optional paid swaps</h2>
      <p>
        These are not gates on the free product — they&rsquo;re drop-in upgrades for anyone who wants
        higher-fidelity data. The curated free models remain the default.
      </p>
      <ul>
        <li>
          <strong>OEM-exact maintenance intervals</strong> — replace the curated interval seed with a
          licensed schedule source where one is available.
        </li>
        <li>
          <strong>Plate &rarr; VIN lookup</strong> — add a paid plate-decode provider so owners can
          start from a license plate instead of a VIN. Skipped in the free build by design.
        </li>
      </ul>

      <h2>Conveniences in progress</h2>
      <ul>
        <li>
          <strong>SMS reminders</strong> — Twilio-backed reminders alongside email, opt-in and
          confirm-gated like everything else.
        </li>
        <li>
          <strong>Calendar sync</strong> — add service due-dates and recall appointments to Google
          Calendar or an <code>.ics</code> file. GloveBox prepares the event; you confirm and add it.
        </li>
        <li>
          <strong>Richer health checks</strong> — digitize a shop&rsquo;s multi-point inspection sheet
          from a photo.
        </li>
      </ul>

      <h2>Explicitly out of scope</h2>
      <ul>
        <li>VIN history, accidents, and title data (CARFAX/AutoCheck are closed and paid).</li>
        <li>Anything that auto-pays, auto-books, or stores payment details.</li>
        <li>Scraping closed dealer-management or parts catalogs.</li>
      </ul>

      <p>
        Have an idea or want to help build one of these? GloveBox is open source — open an issue or
        a pull request on{" "}
        <a href="https://github.com/sahielbose/GloveBox" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>
    </ProsePage>
  );
}
