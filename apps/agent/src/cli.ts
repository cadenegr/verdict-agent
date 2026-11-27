// make evidence IN=<file>: one URL per line in, one JSON evidence record per line out.
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { MAX_PAGES_PER_PRODUCT } from "@app/shared";
import { collectEvidence } from "./collect.ts";
import { createFetcher } from "./http.ts";
import { searchFromEnv } from "./search/index.ts";

export function readUrls(text: string): string[] {
  const urls: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    urls.push(/^https?:\/\//i.test(line) ? line : `https://${line}`);
  }
  return urls;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: make evidence IN=<file with one URL per line>");
    process.exit(2);
  }
  const envFile = new URL("../../../.env", import.meta.url);
  if (existsSync(envFile)) process.loadEnvFile(envFile);

  const search = searchFromEnv(process.env);
  const archive = createFetcher({ maxRequests: null, timeoutMs: 30_000 });
  // One product at a time on purpose: the archive fetcher is shared, and its
  // one-request-per-second gap per host only holds when calls do not overlap.
  for (const url of readUrls(readFileSync(file, "utf8"))) {
    const site = createFetcher({ maxRequests: MAX_PAGES_PER_PRODUCT, timeoutMs: 15_000 });
    const evidence = await collectEvidence(url, {
      site,
      archive,
      search,
      now: () => new Date(),
      clock: Date.now,
    });
    console.log(JSON.stringify(evidence));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
