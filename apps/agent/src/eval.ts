// make eval: score live/verdicts.jsonl against the labelled test set.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { scoreVerdicts, type EvalReport } from "@app/core";
import { TestSetSchema, VerdictLineSchema, type VerdictLine } from "@app/shared";
import { VERDICTS_FILE } from "./verdict.ts";

const TEST_SET = new URL("../../../fixtures/test-products.json", import.meta.url);

function readVerdicts(text: string): { lines: VerdictLine[]; bad: number } {
  const lines: VerdictLine[] = [];
  let bad = 0;
  for (const raw of text.split("\n")) {
    if (raw.trim() === "") continue;
    try {
      const parsed = VerdictLineSchema.safeParse(JSON.parse(raw));
      if (parsed.success) lines.push(parsed.data);
      else bad += 1;
    } catch {
      bad += 1;
    }
  }
  return { lines, bad };
}

function print(report: EvalReport) {
  const width = Math.max(...report.rows.map((r) => r.name.length), 7);
  console.log(`${"Product".padEnd(width)}  Label  Verdict  Conf.  Right`);
  for (const r of report.rows) {
    const verdict = (r.verdict ?? "missing").padEnd(7);
    const confidence = (r.confidence === null ? "-" : r.confidence.toFixed(2)).padEnd(5);
    console.log(
      `${r.name.padEnd(width)}  ${r.label.padEnd(5)}  ${verdict}  ${confidence}  ${r.right ? "yes" : "no"}`,
    );
  }
  console.log(`\nTotal: ${report.right} of ${report.total} right`);
}

function main() {
  if (!existsSync(VERDICTS_FILE)) {
    console.error("No live/verdicts.jsonl yet. Run: make verdict IN=fixtures/test-products.json");
    process.exit(2);
  }
  const testSet = TestSetSchema.parse(JSON.parse(readFileSync(TEST_SET, "utf8")));
  const { lines, bad } = readVerdicts(readFileSync(VERDICTS_FILE, "utf8"));
  if (bad > 0)
    console.error(`Skipped ${bad} unreadable line(s) in ${fileURLToPath(VERDICTS_FILE)}`);
  print(scoreVerdicts(lines, testSet.products));
}

main();
