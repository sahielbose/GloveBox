import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { GithubStars } from "@/components/site/GithubStars";
import { cn } from "@/lib/utils";

/**
 * Shared shell for the doc / legal pages — Nav + Footer + a readable measure with
 * consistent heading, list, link, and code styling. Keeps the dark editorial
 * aesthetic across /docs, /self-hosting, /roadmap, /privacy, /security, /license.
 *
 * The `.prose-gb` styles are scoped local utilities below so we never touch
 * globals.css; descendant selectors style the markup callers pass as children.
 */
export function ProsePage({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav stars={<GithubStars />} />
      <main>
        <article className="container-gb pb-24 pt-36 md:pt-44">
          <header className="max-w-2xl border-b border-hairline pb-10">
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="display-l mt-6 text-chalk">{title}</h1>
            {intro && <p className="lead mt-5 text-ash">{intro}</p>}
            {updated && (
              <p className="mt-5 font-mono text-xs text-ash">Last updated {updated}</p>
            )}
          </header>

          <Prose className="mt-12 max-w-2xl">{children}</Prose>
        </article>
      </main>
      <Footer />
    </>
  );
}

/**
 * Bare prose wrapper (no page chrome) for embedding readable copy anywhere.
 */
export function Prose({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "text-[0.975rem] leading-relaxed text-ash",
        // Headings
        "[&_h2]:mt-12 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-chalk first:[&_h2]:mt-0",
        "[&_h3]:mt-8 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-chalk",
        // Body
        "[&_p]:mt-4 [&_p]:max-w-prose",
        // Lists
        "[&_ul]:mt-4 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul>li]:list-disc [&_ul>li]:marker:text-sage",
        "[&_ol]:mt-4 [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol>li]:list-decimal [&_ol>li]:marker:text-ash",
        // Inline
        "[&_strong]:font-medium [&_strong]:text-chalk",
        "[&_a]:text-chalk [&_a]:underline [&_a]:decoration-hairline [&_a]:underline-offset-2 hover:[&_a]:decoration-sage",
        // Code
        "[&_code]:rounded-chip [&_code]:border [&_code]:border-hairline [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-chalk",
        "[&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:rounded-card [&_pre]:border [&_pre]:border-hairline [&_pre]:bg-surface [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:text-chalk [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        // Dividers + quotes
        "[&_hr]:my-10 [&_hr]:border-hairline",
        "[&_blockquote]:mt-4 [&_blockquote]:border-l-2 [&_blockquote]:border-sage [&_blockquote]:pl-4 [&_blockquote]:text-ash",
        className,
      )}
    >
      {children}
    </div>
  );
}
