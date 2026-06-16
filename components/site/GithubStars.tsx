import { Star } from "lucide-react";

const REPO = "sahielbose/GloveBox";

/**
 * Server component — fetches the real star count from the public GitHub API and
 * renders "★ N", caching for an hour. If the fetch fails or the shape is off, we
 * degrade to a plain "GitHub" pill rather than inventing a number (UI spec §6).
 */
async function getStarCount(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: unknown };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

function formatStars(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}

export async function GithubStars({ className }: { className?: string }) {
  const stars = await getStarCount();
  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "inline-flex min-h-11 items-center gap-1.5 rounded-btn border border-hairline px-3 py-2 font-mono text-[0.8125rem] text-ash transition-colors hover:border-chalk/30 hover:text-chalk " +
        (className ?? "")
      }
      aria-label={stars != null ? `GitHub — ${stars} stars` : "GitHub repository"}
    >
      <Star size={13} className="text-sage" aria-hidden />
      {stars != null ? formatStars(stars) : "GitHub"}
    </a>
  );
}
