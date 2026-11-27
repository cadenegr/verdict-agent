// Turning the agent's verdict into Stackgini's traffic light and columns.
import {
  STACKGINI_COLUMNS,
  type Label,
  type Rating,
  type StackginiRow,
  type VerdictLine,
} from "@app/shared";

/** How a human label in a test set reads as a traffic light. */
export const LABEL_RATING: Readonly<Record<Label, Rating>> = {
  trust: "green",
  doubt: "yellow",
  dead: "red",
};

const OVERALL = { green: "Green", yellow: "Yellow", red: "Red" } as const;

/**
 * Red when the product is dead or any evidence is a red flag. Yellow when the
 * agent doubts it or is unsure (Stackgini has no "unsure"). Green otherwise.
 * Yellow flags alone don't make a product Yellow: Stackgini rates products
 * Green that carry yellow flags (sample 1, Omnissa).
 */
export function ratingOf(line: Pick<VerdictLine, "verdict" | "evidence">): Rating {
  if (line.verdict === "dead" || line.evidence.some((e) => e.flag === "red")) return "red";
  if (line.verdict === "doubt" || line.verdict === "unsure") return "yellow";
  return "green";
}

function flagsText(line: VerdictLine, flag: Rating): string {
  const items = line.evidence.filter((e) => e.flag === flag && e.kind !== "gap");
  return items.length === 0
    ? "None identified."
    : items.map((e) => `${e.note} (${e.url})`).join("; ");
}

function reasoning(line: VerdictLine, rating: Rating): string {
  const gaps = line.evidence.filter((e) => e.kind === "gap").map((e) => e.note);
  const why =
    line.verdict === "unsure"
      ? "Not enough evidence for a firm call."
      : `The agent's call is ${line.verdict}, with confidence ${line.confidence.toFixed(2)}.`;
  const red = rating === "red" && line.verdict !== "dead" ? " A red flag decides the rating." : "";
  return [why + red, ...gaps].join(" ");
}

/** One row in the organizers' columns, built only from what the agent found. */
export function toStackgini(line: VerdictLine): StackginiRow {
  const rating = ratingOf(line);
  return {
    id: line.id ?? "",
    url: line.product,
    product: line.name,
    vendor: line.vendor ?? "",
    overall: OVERALL[rating],
    green_flags: flagsText(line, "green"),
    yellow_flags: flagsText(line, "yellow"),
    red_flags: flagsText(line, "red"),
    reasoning: reasoning(line, rating),
  };
}

/** A CSV cell: always quoted, quotes doubled, like the organizers' file. */
const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;

/** The whole file: header row, then one row per product. */
export function stackginiCsv(rows: readonly StackginiRow[]): string {
  const lines = [STACKGINI_COLUMNS.map(cell).join(",")];
  for (const row of rows) lines.push(STACKGINI_COLUMNS.map((c) => cell(row[c])).join(","));
  return lines.join("\n") + "\n";
}
