import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { DataMarquee } from "@/components/site/DataMarquee";
import { Capabilities } from "@/components/site/Capabilities";
import { FeatureTabs } from "@/components/site/FeatureTabs";
import { HowItWorks } from "@/components/site/HowItWorks";
import { OpenSource } from "@/components/site/OpenSource";
import { ClosingCTA } from "@/components/site/ClosingCTA";
import { Footer } from "@/components/site/Footer";
import { GithubStars } from "@/components/site/GithubStars";

/**
 * GloveBox homepage — the warm-dark editorial single-scroll marketing page
 * (GloveBox-UI.md §7). Composes the sections in order; the GitHub star pill is
 * a server component passed into the client Nav as a slot.
 */
export default function HomePage() {
  return (
    <>
      <Nav stars={<GithubStars />} />
      <main>
        <Hero />
        <DataMarquee />
        <Capabilities />
        <FeatureTabs />
        <HowItWorks />
        <OpenSource />
        <ClosingCTA />
      </main>
      <Footer />
    </>
  );
}
