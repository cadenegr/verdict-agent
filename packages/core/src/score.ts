// Scoring the agent's verdicts against a labelled test set.
import type { Label, LabelledProduct, Verdict, VerdictLine } from "@app/shared";
import { productKey } from "./products.ts";

export interface ProductScore {
  name: string;
  url: string;
  label: Label;
  /** null when the agent wrote no verdict for this product. */
  verdict: Verdict | null;
  confidence: number | null;
  right: boolean;
}

export interface EvalReport {
  rows: ProductScore[];
  right: number;
  total: number;
}

/**
 * A product is right when the verdict equals the label. `unsure` and a missing
 * verdict count as wrong. When a product has several lines, the last one counts.
 */
export function scoreVerdicts(
  lines: readonly VerdictLine[],
  products: readonly LabelledProduct[],
): EvalReport {
  const latest = new Map<string, VerdictLine>();
  for (const line of lines) latest.set(productKey(line.product), line);

  const rows = products.map((p): ProductScore => {
    const line = latest.get(productKey(p.url));
    const verdict = line?.verdict ?? null;
    return {
      name: p.name,
      url: p.url,
      label: p.label,
      verdict,
      confidence: line?.confidence ?? null,
      right: verdict === p.label,
    };
  });
  return { rows, right: rows.filter((r) => r.right).length, total: rows.length };
}
