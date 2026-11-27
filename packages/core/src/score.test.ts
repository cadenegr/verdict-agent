import { describe, expect, it } from "vitest";
import type { LabelledProduct, VerdictLine } from "@app/shared";
import { scoreVerdicts } from "./score.ts";

const products: LabelledProduct[] = [
  { name: "Linear", url: "https://linear.app", label: "trust", reason: "" },
  { name: "Keybase", url: "https://keybase.io", label: "dead", reason: "" },
];

const line = (product: string, verdict: VerdictLine["verdict"], confidence = 0.8): VerdictLine => ({
  name: product,
  product,
  verdict,
  confidence,
  evidence: [],
  checkedAt: "2026-11-27T12:00:00.000Z",
});

describe("scoreVerdicts", () => {
  it("counts verdicts that equal the label", () => {
    const report = scoreVerdicts(
      [line("https://linear.app/", "trust"), line("https://keybase.io", "dead")],
      products,
    );
    expect(report.right).toBe(2);
    expect(report.total).toBe(2);
    expect(report.rows.every((r) => r.right)).toBe(true);
  });

  it("counts wrong verdicts and unsure as wrong", () => {
    const report = scoreVerdicts(
      [line("https://linear.app", "dead"), line("https://keybase.io", "unsure", 0.5)],
      products,
    );
    expect(report.right).toBe(0);
    expect(report.rows[1]).toMatchObject({ verdict: "unsure", confidence: 0.5, right: false });
  });

  it("counts a missing product as wrong", () => {
    const report = scoreVerdicts([line("https://linear.app", "trust")], products);
    expect(report.right).toBe(1);
    expect(report.rows[1]).toMatchObject({ verdict: null, confidence: null, right: false });
  });

  it("uses the last line when a product was judged twice", () => {
    const report = scoreVerdicts(
      [line("https://keybase.io", "trust"), line("https://keybase.io", "dead")],
      products,
    );
    expect(report.rows[1]?.verdict).toBe("dead");
  });
});
