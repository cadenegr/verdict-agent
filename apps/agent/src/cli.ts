// make evidence IN=<file>: one URL per line in, one JSON evidence record per line out.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { readUrls } from "@app/core";
import { startAgent } from "./run.ts";

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: make evidence IN=<file with one URL per line>");
    process.exit(2);
  }
  const agent = startAgent();
  // One product at a time on purpose: the archive fetcher is shared, and its
  // one-request-per-second gap per host only holds when calls do not overlap.
  for (const url of readUrls(readFileSync(file, "utf8"))) {
    const evidence = await agent.collect(url);
    console.log(JSON.stringify(evidence));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
