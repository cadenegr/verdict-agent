// What every command of the agent needs before it touches the network: settings, search and fetchers.
import { existsSync } from "node:fs";
import { MAX_PAGES_PER_PRODUCT, type Evidence } from "@app/shared";
import { collectEvidence } from "./collect.ts";
import { createFetcher, type Fetcher } from "./http.ts";
import { searchFromEnv, type SearchProvider } from "./search/index.ts";

/** Products handled side by side. Each vendor is its own host; the shared archive is queued. */
export const PRODUCTS_AT_ONCE = 4;

export interface Agent {
  /** Collects the evidence for one product. Safe to call for several products at once. */
  collect(url: string): Promise<Evidence>;
}

export function startAgent(): Agent {
  const envFile = new URL("../../../.env", import.meta.url);
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const search: SearchProvider = searchFromEnv(process.env);
  // Shared by every product, so its per-host queue keeps the archive at one request per second.
  const archive: Fetcher = createFetcher({ maxRequests: null, timeoutMs: 30_000 });
  return {
    collect(url) {
      const site = createFetcher({ maxRequests: MAX_PAGES_PER_PRODUCT, timeoutMs: 15_000 });
      return collectEvidence(url, {
        site,
        archive,
        search,
        now: () => new Date(),
        clock: Date.now,
      });
    },
  };
}
