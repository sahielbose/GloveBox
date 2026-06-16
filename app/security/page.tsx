import type { Metadata } from "next";
import { ProsePage } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: "Security",
  description:
    "GloveBox's security posture: no payment or credential handling, confirm gates on every outbound action, and recalls sourced only from official feeds.",
};

export default function SecurityPage() {
  return (
    <ProsePage
      eyebrow="Security"
      title="What we don't touch is the point"
      intro="The most secure data is the data we never collect. GloveBox is built so the highest-risk things — money, credentials, irreversible actions — simply aren't ours to mishandle."
      updated="June 2026"
    >
      <h2>No payment or credential handling</h2>
      <p>
        GloveBox never asks for, stores, or processes card numbers, bank details, or any login to a
        dealer, shop, or third-party account. There is no payment surface to breach because there is
        no payment surface. When something needs paying or booking, we prepare the details and hand
        off — you complete it yourself.
      </p>

      <h2>Confirm gates on everything outbound</h2>
      <p>
        Any action that sends, posts, schedules, exports, shares, or messages requires an explicit
        confirm step in the interface. GloveBox will draft a shop message or prepare a calendar event,
        but it never auto-sends, auto-books, auto-pays, or auto-submits a form. The human always
        triggers the send.
      </p>

      <h2>Recalls only from official feeds</h2>
      <p>
        Recall data comes exclusively from NHTSA and CPSC, with the campaign ID and a link to the
        official notice preserved. GloveBox never invents a recall and never marks one resolved
        without official status. A false negative here is a safety miss, so matching is validated
        against known cases.
      </p>

      <h2>Authentication</h2>
      <p>
        Sign-in is passwordless: a magic link sent to your email. We never store passwords, so there
        are none to leak. Sessions live server-side in Postgres.
      </p>

      <h2>Data at rest and in transit</h2>
      <ul>
        <li>All traffic is served over HTTPS.</li>
        <li>Uploaded documents are encrypted at rest where the deployment supports it.</li>
        <li>
          Secrets live only in environment variables — never in the repository. The repo ships an{" "}
          <code>.env.example</code> with keys and no values.
        </li>
        <li>
          You can self-host to keep every byte on infrastructure you control. See the{" "}
          <a href="/self-hosting">self-hosting guide</a>.
        </li>
      </ul>

      <h2>Safety bias by design</h2>
      <p>
        For safety-critical systems — brakes, steering, overheating, airbags, tires — the symptom
        decoder errs toward &ldquo;get it inspected&rdquo; or &ldquo;don&rsquo;t drive.&rdquo; GloveBox
        will never reassure you about a clearly unsafe condition.
      </p>

      <h2>Reporting a vulnerability</h2>
      <p>
        Found something? Please report it privately through{" "}
        <a
          href="https://github.com/sahielbose/GloveBox/security/advisories/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub security advisories
        </a>{" "}
        rather than a public issue, so we can fix it before it&rsquo;s disclosed. Because the code is
        open, you can audit any of these claims directly.
      </p>
    </ProsePage>
  );
}
