// Gathers the evidence for one product. Network in, record out; the reading rules are in @app/core.
import {
  assembleEvidence,
  extractLinks,
  findCopyrightYear,
  findSiteName,
  pickDocsLink,
  pickLinksToCheck,
  riskQueries,
} from "@app/core";
import { MAX_PAGES_PER_PRODUCT, type DeadLink, type Evidence } from "@app/shared";
import type { Fetcher } from "./http.ts";
import { mapWithLimit } from "./pool.ts";
import type { SearchProvider } from "./search/index.ts";
import { findSnapshots } from "./wayback.ts";

/** Links on the vendor's site checked side by side. All on one host, so the queue spaces them. */
const LINKS_AT_ONCE = 2;

export interface CollectDeps {
  /** A fetcher for the vendor's own site, capped at MAX_PAGES_PER_PRODUCT. */
  site: Fetcher;
  /** A fetcher for the Wayback Machine. */
  archive: Fetcher;
  search: SearchProvider;
  now: () => Date;
  clock: () => number;
}

/**
 * `name` is the product's name from the input list, when there is one: it searches
 * better than the page title ("Omnissa: Digital Work Platform | Omnissa").
 */
export async function collectEvidence(
  url: string,
  deps: CollectDeps,
  name?: string,
): Promise<Evidence> {
  const started = deps.clock();
  const fetchedAt = deps.now();
  const errors: string[] = [];

  const home = await deps.site.get(url, { readBody: true });
  const pageUrl = home.finalUrl ?? url;
  const html = home.body ?? "";
  if (home.status !== 200) errors.push(`home: ${home.error ?? `status ${home.status}`}`);

  const links = extractLinks(html, pageUrl);
  const docs = pickDocsLink(links, pageUrl);
  const toCheck = pickLinksToCheck(links, pageUrl, MAX_PAGES_PER_PRODUCT - deps.site.used);
  // Two in flight: the fetcher's per-host queue still starts them one second apart,
  // and a slow reply no longer holds up the next request.
  const checked: DeadLink[] = await mapWithLimit(toCheck, LINKS_AT_ONCE, async (link) => ({
    url: link,
    status: (await deps.site.get(link)).status,
  }));

  const wayback = await findSnapshots(deps.archive, url);
  if (wayback.error) errors.push(wayback.error);

  const searchName = name ?? findSiteName(html, pageUrl);
  const found = await deps.search.search(riskQueries(searchName));
  if (found.error) errors.push(found.error);

  return assembleEvidence({
    url,
    finalUrl: home.finalUrl,
    fetchedAt,
    copyrightYear: findCopyrightYear(html),
    checked,
    docs,
    wayback: { first: wayback.first, last: wayback.last },
    search: found.hits,
    errors,
    durationMs: deps.clock() - started,
  });
}
