// make verdict IN=<file>: judge each product and write one line per product to live/verdicts.jsonl.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { givenName, judge, parseProductList } from "@app/core";
import type { VerdictLine } from "@app/shared";
import { mapWithLimit } from "./pool.ts";
import { PRODUCTS_AT_ONCE, startAgent } from "./run.ts";

export const LIVE_DIR = new URL("../../../live/", import.meta.url);
export const VERDICTS_FILE = new URL("verdicts.jsonl", LIVE_DIR);

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: make verdict IN=<test set JSON, or one URL per line>");
    process.exit(2);
  }
  const list = parseProductList(readFileSync(file, "utf8"));
  if (!list.ok) {
    console.error(`Can't read ${file}: ${list.error}`);
    process.exit(2);
  }

  const agent = startAgent();
  const lines = await mapWithLimit(list.products, PRODUCTS_AT_ONCE, async (product) => {
    const evidence = await agent.collect(product.url, givenName(product));
    const checkedAt = new Date();
    const line: VerdictLine = {
      name: product.name,
      ...judge(evidence, checkedAt),
      checkedAt: checkedAt.toISOString(),
    };
    console.error(`${product.name}: ${line.verdict} (${line.confidence})`);
    return line;
  });

  mkdirSync(LIVE_DIR, { recursive: true });
  writeFileSync(VERDICTS_FILE, lines.map((line) => JSON.stringify(line)).join("\n") + "\n");
  console.error(`${lines.length} verdicts in ${fileURLToPath(VERDICTS_FILE)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
