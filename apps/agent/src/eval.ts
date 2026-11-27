// make eval [LABELS=<test set>] [HALF=odd|even]: score live/verdicts.jsonl against a labelled set.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { HALVES, pickHalf, scoreVerdicts, type EvalReport, type Half } from "@app/core";
import { RATINGS, TestSetSchema } from "@app/shared";
import { readVerdicts } from "./lines.ts";
import { VERDICTS_FILE } from "./verdict.ts";

const DEFAULT_TEST_SET = fileURLToPath(
  new URL("../../../fixtures/test-products.json", import.meta.url),
);

function print(report: EvalReport) {
  const width = Math.max(...report.rows.map((r) => r.name.length), 7);
  console.log(`${"Product".padEnd(width)}  Label  Verdict  Rating   Conf.  Right`);
  for (const r of report.rows) {
    const verdict = (r.verdict ?? "missing").padEnd(7);
    const rating = (r.rating ?? "-").padEnd(7);
    const confidence = (r.confidence === null ? "-" : r.confidence.toFixed(2)).padEnd(5);
    console.log(
      `${r.name.slice(0, width).padEnd(width)}  ${r.label.padEnd(5)}  ${verdict}  ${rating}  ${confidence}  ${r.right ? "yes" : "no"}`,
    );
  }
  console.log(`\nTotal: ${report.right} of ${report.total} right`);
  const columns = [...RATINGS, "missing"] as const;
  console.log(`\nwanted \\ got  ${columns.map((c) => c.padStart(7)).join(" ")}`);
  for (const wanted of RATINGS) {
    const counts = columns.map((c) => String(report.confusion[wanted][c]).padStart(7));
    console.log(`${wanted.padEnd(12)}  ${counts.join(" ")}`);
  }
}

function main() {
  const file = process.argv[2] || DEFAULT_TEST_SET;
  const half = (process.argv[3] || "all") as Half;
  if (!HALVES.includes(half)) {
    console.error(`HALF must be one of: ${HALVES.join(", ")}`);
    process.exit(2);
  }
  if (!existsSync(VERDICTS_FILE)) {
    console.error(`No live/verdicts.jsonl yet. Run: make verdict IN=${file}`);
    process.exit(2);
  }
  const testSet = TestSetSchema.parse(JSON.parse(readFileSync(file, "utf8")));
  const { lines, bad } = readVerdicts(readFileSync(VERDICTS_FILE, "utf8"));
  if (bad > 0)
    console.error(`Skipped ${bad} unreadable line(s) in ${fileURLToPath(VERDICTS_FILE)}`);
  print(scoreVerdicts(lines, pickHalf(testSet.products, half)));
}

main();
