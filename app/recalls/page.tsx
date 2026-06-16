import type { Metadata } from "next";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { GithubStars } from "@/components/site/GithubStars";
import { RecallLookup } from "./RecallLookup";

export const metadata: Metadata = {
  title: "Recall lookup",
  description:
    "Free public recall lookup — enter a VIN or year, make, and model to see open NHTSA recalls for your car, with campaign IDs and official source links. No account needed.",
};

/**
 * Public recall lookup (§3) — a real free utility and the top of the funnel.
 * No auth, nothing saved. Uses the marketing shell (Nav + Footer).
 */
export default function RecallsPage() {
  return (
    <>
      <Nav stars={<GithubStars />} />
      <main>
        <section className="container-gb pb-12 pt-36 md:pt-44">
          <div className="max-w-2xl">
            <span className="eyebrow">Free recall lookup</span>
            <h1 className="display-l mt-6 text-chalk">
              Is your car under recall?
            </h1>
            <p className="lead mt-5 text-ash">
              Enter a VIN or your year, make, and model. We check NHTSA&rsquo;s official feed and
              show every open recall — what it affects, why it matters, and how to get it fixed.
              No account, nothing saved.
            </p>
          </div>
        </section>

        <section className="container-gb pb-24">
          <div className="max-w-3xl">
            <RecallLookup />
          </div>

          <p className="mt-10 max-w-2xl text-xs leading-relaxed text-ash/80">
            Recall data comes directly from the National Highway Traffic Safety Administration
            (NHTSA). GloveBox never invents or resolves a recall — each result links to the
            official notice. This lookup is informational; confirm details and completion status
            with a franchised dealer.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
