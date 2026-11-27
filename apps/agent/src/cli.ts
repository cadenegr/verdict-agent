// make evidence IN=<file>: one URL per line in, one JSON evidence record per line out.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { readUrls } from "@app/core";
import { mapWithLimit } from "./pool.ts";
import { PRODUCTS_AT_ONCE, startAgent } from "./run.ts";

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: make evidence IN=<file with one URL per line>");
    process.exit(2);
  }
  const agent = startAgent();
  // Side by side, like make verdict: the fetcher's per-host queue keeps each host at one request per second.
  const records = await mapWithLimit(
    readUrls(readFileSync(file, "utf8")),
    PRODUCTS_AT_ONCE,
    (url) => agent.collect(url),
  );
  for (const evidence of records) console.log(JSON.stringify(evidence));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
