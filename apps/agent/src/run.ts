// What every command of the agent needs before it touches the network: settings, search and fetchers.
import { existsSync } from "node:fs";
import { MAX_PAGES_PER_PRODUCT, type Evidence } from "@app/shared";
import { collectEvidence } from "./collect.ts";
import { createFetcher, createHostQueue, type Fetcher } from "./http.ts";
import { searchFromEnv, type SearchProvider } from "./search/index.ts";

/** Products handled side by side. The shared host queue keeps every host polite. */
export const PRODUCTS_AT_ONCE = 4;

export interface Agent {
  /** Collects the evidence for one product. Safe to call for several products at once. */
  collect(url: string, name?: string): Promise<Evidence>;
}

export function startAgent(): Agent {
  const envFile = new URL("../../../.env", import.meta.url);
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const search: SearchProvider = searchFromEnv(process.env);
  // One queue for every fetcher: a host gets at most one request per second even when
  // two products share it, or when the archive serves several products at once.
  const hosts = createHostQueue();
  const archive: Fetcher = createFetcher({ maxRequests: null, timeoutMs: 30_000, hosts });
  return {
    collect(url, name) {
      // A fetcher per product for its page budget; the queue is shared.
      const site = createFetcher({ maxRequests: MAX_PAGES_PER_PRODUCT, timeoutMs: 15_000, hosts });
      return collectEvidence(
        url,
        {
          site,
          archive,
          search,
          now: () => new Date(),
          clock: Date.now,
        },
        name,
      );
    },
  };
}
