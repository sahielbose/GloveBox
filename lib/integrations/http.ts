/**
 * Small resilient JSON fetch helper for the public data APIs (NHTSA, CPSC,
 * FuelEconomy). Timeout + limited retry + graceful typed failure. These APIs
 * need no keys.
 */
export type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

export async function getJson<T>(
  url: string,
  opts: { timeoutMs?: number; retries?: number; headers?: Record<string, string> } = {},
): Promise<FetchResult<T>> {
  const { timeoutMs = 12000, retries = 2, headers = {} } = opts;
  let lastErr = "unknown error";

  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: "application/json", "User-Agent": "GloveBox/0.1 (+https://github.com/sahielbose/GloveBox)", ...headers },
        cache: "no-store",
      });
      clearTimeout(timer);
      if (!res.ok) {
        lastErr = `HTTP ${res.status}`;
        // Don't retry 4xx (other than 429).
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          return { ok: false, error: lastErr, status: res.status };
        }
        continue;
      }
      const data = (await res.json()) as T;
      return { ok: true, data };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err instanceof Error ? err.message : String(err);
    }
  }
  return { ok: false, error: lastErr };
}
