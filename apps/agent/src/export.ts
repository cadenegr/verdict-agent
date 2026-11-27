// make export: write live/verdicts.jsonl as stackgini-verdicts.csv at the top of the repo
// (the file the organizers grade), in the columns of their labelled set.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stackginiCsv, toStackgini } from "@app/core";
import { readVerdicts } from "./lines.ts";
import { LIVE_DIR, VERDICTS_FILE } from "./verdict.ts";

const CSV_FILE = new URL("../stackgini-verdicts.csv", LIVE_DIR);

function main() {
  if (!existsSync(VERDICTS_FILE)) {
    console.error("No live/verdicts.jsonl yet. Run: make verdict IN=<file>");
    process.exit(2);
  }
  const { lines, bad } = readVerdicts(readFileSync(VERDICTS_FILE, "utf8"));
  if (bad > 0) console.error(`Skipped ${bad} unreadable line(s)`);
  writeFileSync(CSV_FILE, stackginiCsv(lines.map(toStackgini)));
  console.error(`${lines.length} rows in ${fileURLToPath(CSV_FILE)}`);
}

main();
