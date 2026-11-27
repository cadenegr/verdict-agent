// Wayback Machine CDX API: free and keyless (checked 2026-11-26).
import { waybackLink } from "@app/core";
import type { Fetcher } from "./http.ts";

const CDX = "https://web.archive.org/cdx/search/cdx";

export interface WaybackResult {
  first: string | null;
  last: string | null;
  error: string | null;
}

async function oneSnapshot(fetcher: Fetcher, host: string, limit: 1 | -1) {
  const query = new URLSearchParams({
    url: host,
    limit: String(limit),
    fl: "timestamp,original",
    output: "json",
  });
  const page = await fetcher.get(`${CDX}?${query}`, { readBody: true });
  if (page.status !== 200 || page.body === null) {
    return { link: null, error: `wayback: ${page.error ?? `status ${page.status}`}` };
  }
  try {
    const rows = JSON.parse(page.body) as string[][];
    return { link: waybackLink(rows[1]), error: null };
  } catch {
    return { link: null, error: "wayback: unreadable reply" };
  }
}

/** First and last snapshot of the site's home page. */
export async function findSnapshots(fetcher: Fetcher, siteUrl: string): Promise<WaybackResult> {
  const host = new URL(siteUrl).hostname;
  const first = await oneSnapshot(fetcher, host, 1);
  const last = await oneSnapshot(fetcher, host, -1);
  return { first: first.link, last: last.link, error: first.error ?? last.error };
}
