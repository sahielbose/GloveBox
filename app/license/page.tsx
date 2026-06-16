import type { Metadata } from "next";
import { ProsePage } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: "License",
  description:
    "GloveBox is released under the MIT License — fork it, ship it, run it on your own machine. The full text is here.",
};

const MIT_TEXT = `MIT License

Copyright (c) 2026 GloveBox contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

export default function LicensePage() {
  return (
    <ProsePage
      eyebrow="License"
      title="MIT Licensed — free, forever"
      intro="GloveBox is released under the MIT License: one of the most permissive open-source licenses there is. Use it, change it, ship it, run it on your own machine — commercially or not — as long as the copyright notice rides along."
      updated="June 2026"
    >
      <h2>What this means in plain English</h2>
      <ul>
        <li>
          <strong>Use it freely</strong> — personally or commercially, with no fee and no
          subscription.
        </li>
        <li>
          <strong>Fork and modify it</strong> — change anything; ship your own version.
        </li>
        <li>
          <strong>Self-host it</strong> — run the whole product on your own infrastructure.
        </li>
        <li>
          <strong>Keep the notice</strong> — include the copyright and license text in copies.
        </li>
        <li>
          <strong>No warranty</strong> — it&rsquo;s provided as-is; GloveBox&rsquo;s estimates are
          informational, not guarantees.
        </li>
      </ul>
      <p>
        Every dependency we use is permissively licensed too. If a default would ever pull in a
        closed dependency as the only path, we flag it and ship a free fallback instead — as we have
        for pricing and maintenance intervals.
      </p>

      <h2>Full license text</h2>
      <pre>
        <code>{MIT_TEXT}</code>
      </pre>

      <p>
        The canonical{" "}
        <a
          href="https://github.com/sahielbose/GloveBox/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
        >
          LICENSE file
        </a>{" "}
        lives in the repository.
      </p>
    </ProsePage>
  );
}
