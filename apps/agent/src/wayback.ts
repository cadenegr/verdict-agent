// Wayback Machine CDX API: free and keyless (checked 2026-11-26).
import { waybackLink } from "@app/core";
import type { Fetcher } from "./http.ts";

const CDX = "https://web.archive.org/cdx/search/cdx";

/** The archive slows down under load (2026-11-27: 14 of 40 lookups failed in one run). */
export const RETRY_AFTER_MS = 5000;

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A failure that may pass: no reply, rate limit, or a server error. */
const worthRetry = (status: number | null) => status === null || status === 429 || status >= 500;

export interface WaybackResult {
  first: string | null;
  last: string | null;
  error: string | null;
}

async function oneSnapshot(
  fetcher: Fetcher,
  host: string,
  limit: 1 | -1,
  sleep: (ms: number) => Promise<void>,
) {
  const query = new URLSearchParams({
    url: host,
    limit: String(limit),
    fl: "timestamp,original",
    output: "json",
  });
  const link = `${CDX}?${query}`;
  let page = await fetcher.get(link, { readBody: true });
  if (worthRetry(page.status)) {
    // One retry, after a pause; the host queue still keeps 1 request/s on top of it.
    await sleep(RETRY_AFTER_MS);
    page = await fetcher.get(link, { readBody: true });
  }
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
export async function findSnapshots(
  fetcher: Fetcher,
  siteUrl: string,
  sleep: (ms: number) => Promise<void> = pause,
): Promise<WaybackResult> {
  const host = new URL(siteUrl).hostname;
  const first = await oneSnapshot(fetcher, host, 1, sleep);
  const last = await oneSnapshot(fetcher, host, -1, sleep);
  return { first: first.link, last: last.link, error: first.error ?? last.error };
}
