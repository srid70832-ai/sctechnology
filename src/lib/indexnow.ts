const SITE_URL = "https://sctech.vercel.app";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const recentSubmissions = new Map<string, number>();
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

function normalizePublicUrl(path: string): string | null {
  if (!path.startsWith("/")) return null;
  const url = new URL(path, SITE_URL);
  if (url.origin !== SITE_URL) return null;
  if (/^\/(admin|dashboard|profile|student|company|judge|login|payments|receipts|api)(\/|$)/.test(url.pathname)) return null;
  return url.toString();
}

export function notifyIndexNow(paths: string | string[]): void {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    console.warn("IndexNow notification skipped: INDEXNOW_KEY is not configured");
    return;
  }

  const urls = Array.from(new Set((Array.isArray(paths) ? paths : [paths])
    .map(normalizePublicUrl)
    .filter((url): url is string => Boolean(url))))
    .filter((url) => {
      const lastSubmitted = recentSubmissions.get(url) || 0;
      return Date.now() - lastSubmitted >= DEDUPE_WINDOW_MS;
    });

  if (!urls.length) return;
  urls.forEach((url) => recentSubmissions.set(url, Date.now()));

  void fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key,
      keyLocation: `${SITE_URL}/${key}.txt`,
      urlList: urls,
    }),
  }).then(async (response) => {
    if (!response.ok) {
      console.warn(`IndexNow notification failed: HTTP ${response.status}`);
    }
  }).catch((error) => {
    console.warn("IndexNow notification failed:", error);
  });
}

export function publicContentUrl(type: "hackathons" | "internships" | "projects" | "courses" | "companies", identifier: string): string {
  return `/${type}/${encodeURIComponent(identifier)}`;
}