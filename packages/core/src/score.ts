// Scoring the agent's verdicts against a labelled test set.
import {
  type Label,
  type LabelledProduct,
  type Rating,
  type Verdict,
  type VerdictLine,
} from "@app/shared";
import { productKey } from "./products.ts";
import { LABEL_RATING, ratingOf } from "./stackgini.ts";

export interface ProductScore {
  name: string;
  url: string;
  label: Label;
  /** null when the agent wrote no verdict for this product. */
  verdict: Verdict | null;
  /** The traffic light the verdict reads as; null when there is no verdict. */
  rating: Rating | null;
  confidence: number | null;
  right: boolean;
}

/** counts[wanted][got]: how often a product labelled `wanted` was rated `got`. */
export type Confusion = Record<Rating, Record<Rating | "missing", number>>;

export interface EvalReport {
  rows: ProductScore[];
  right: number;
  total: number;
  confusion: Confusion;
}

function emptyConfusion(): Confusion {
  const row = () => ({ green: 0, yellow: 0, red: 0, missing: 0 });
  return { green: row(), yellow: row(), red: row() };
}

/**
 * A product is right when its rating equals the label's rating (trust = green,
 * doubt = yellow, dead = red). `unsure` reads as yellow. A missing verdict is
 * wrong. When a product has several lines, the last one counts.
 */
export function scoreVerdicts(
  lines: readonly VerdictLine[],
  products: readonly LabelledProduct[],
): EvalReport {
  const latest = new Map<string, VerdictLine>();
  for (const line of lines) latest.set(productKey(line.product), line);

  const confusion = emptyConfusion();
  const rows = products.map((p): ProductScore => {
    const line = latest.get(productKey(p.url));
    const rating = line ? ratingOf(line) : null;
    const wanted = LABEL_RATING[p.label];
    confusion[wanted][rating ?? "missing"] += 1;
    return {
      name: p.name,
      url: p.url,
      label: p.label,
      verdict: line?.verdict ?? null,
      rating,
      confidence: line?.confidence ?? null,
      right: rating === wanted,
    };
  });
  return { rows, right: rows.filter((r) => r.right).length, total: rows.length, confusion };
}

export const HALVES = ["all", "odd", "even"] as const;
export type Half = (typeof HALVES)[number];

/**
 * Odd or even positions in the list (1-based), so the weights can be tuned on
 * one half and scored on the other.
 */
export function pickHalf<T>(items: readonly T[], half: Half): T[] {
  if (half === "all") return [...items];
  const rest = half === "odd" ? 0 : 1;
  return items.filter((_, i) => i % 2 === rest);
}
