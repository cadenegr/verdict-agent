// make verdict IN=<file>: judge each product and write one line per product to live/verdicts.jsonl.
// The raw evidence goes to live/evidence.jsonl. REUSE=1 reuses its search hits (they cost
// tokens) and its archive lookups that answered; the sites are read again.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { givenName, judge, parseProductList } from "@app/core";
import type { Evidence, VerdictLine } from "@app/shared";
import { judgeFromEnv } from "./judge.ts";
import { readEvidence } from "./lines.ts";
import { mapWithLimit } from "./pool.ts";
import { PRODUCTS_AT_ONCE, startAgent } from "./run.ts";

export const LIVE_DIR = new URL("../../../live/", import.meta.url);
export const VERDICTS_FILE = new URL("verdicts.jsonl", LIVE_DIR);
export const EVIDENCE_FILE = new URL("evidence.jsonl", LIVE_DIR);

function savedEvidence(): Map<string, Evidence> {
  if (!existsSync(EVIDENCE_FILE)) return new Map();
  const { byUrl, bad } = readEvidence(readFileSync(EVIDENCE_FILE, "utf8"));
  if (bad > 0)
    console.error(`Skipped ${bad} unreadable line(s) in ${fileURLToPath(EVIDENCE_FILE)}`);
  return byUrl;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: make verdict IN=<organizers CSV, test set JSON, or one URL per line>");
    process.exit(2);
  }
  const list = parseProductList(readFileSync(file, "utf8"));
  if (!list.ok) {
    console.error(`Can't read ${file}: ${list.error}`);
    process.exit(2);
  }

  const saved = savedEvidence();
  const reuse = process.env.REUSE === "1";
  const agent = startAgent();
  // After startAgent: it loads .env, where JUDGE may be set.
  const judgeStep = judgeFromEnv(process.env);
  // Fewer at once when reusing: the archive lookups being retried are the ones that failed under load.
  const atOnce = reuse ? 2 : PRODUCTS_AT_ONCE;
  const lines = await mapWithLimit(list.products, atOnce, async (product) => {
    const earlier = reuse ? saved.get(product.url) : undefined;
    const evidence = await agent.collect(product.url, givenName(product), earlier);
    saved.set(product.url, evidence);
    const checkedAt = new Date();
    const ruled: VerdictLine = {
      name: product.name,
      ...(product.id ? { id: product.id } : {}),
      ...(product.vendor ? { vendor: product.vendor } : {}),
      ...judge(evidence, checkedAt),
      checkedAt: checkedAt.toISOString(),
    };
    const judged = judgeStep ? await judgeStep.review(ruled) : { line: ruled, error: null };
    if (judged.error) console.error(`${product.name}: ${judged.error}; the rules' verdict stays`);
    const line = judged.line;
    console.error(`${product.name}: ${line.verdict} (${line.confidence})`);
    return line;
  });

  mkdirSync(LIVE_DIR, { recursive: true });
  writeFileSync(VERDICTS_FILE, lines.map((line) => JSON.stringify(line)).join("\n") + "\n");
  const records = [...saved.values()].map((record) => JSON.stringify(record));
  writeFileSync(EVIDENCE_FILE, records.join("\n") + "\n");
  console.error(`${lines.length} verdicts in ${fileURLToPath(VERDICTS_FILE)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
