import { describe, expect, it } from "vitest";
import type { LabelledProduct, VerdictLine } from "@app/shared";
import { pickHalf, scoreVerdicts } from "./score.ts";

const products: LabelledProduct[] = [
  { name: "Linear", url: "https://linear.app", label: "trust", reason: "" },
  { name: "Keybase", url: "https://keybase.io", label: "dead", reason: "" },
];

const red = {
  url: "https://news.example.org/fine",
  kind: "search",
  note: "fined",
  flag: "red",
} as const;

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

  it("reads unsure as yellow: right for doubt, wrong for trust or dead", () => {
    const doubt: LabelledProduct = {
      name: "X",
      url: "https://x.example",
      label: "doubt",
      reason: "",
    };
    const report = scoreVerdicts(
      [line("https://x.example", "unsure", 0.5), line("https://linear.app", "unsure", 0.5)],
      [doubt, products[0]!],
    );
    expect(report.rows.map((r) => [r.rating, r.right])).toEqual([
      ["yellow", true],
      ["yellow", false],
    ]);
  });

  it("rates a live product with a red flag red", () => {
    const flagged = { ...line("https://keybase.io", "trust"), evidence: [red] };
    const report = scoreVerdicts([flagged], products);
    expect(report.rows[1]).toMatchObject({ verdict: "trust", rating: "red", right: true });
  });

  it("counts wanted against got in a confusion table", () => {
    const report = scoreVerdicts([line("https://linear.app", "dead")], products);
    expect(report.confusion.green).toEqual({ green: 0, yellow: 0, red: 1, missing: 0 });
    expect(report.confusion.red).toEqual({ green: 0, yellow: 0, red: 0, missing: 1 });
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

describe("pickHalf", () => {
  it("splits a list into odd and even positions, counting from 1", () => {
    const list = [1, 2, 3, 4, 5];
    expect(pickHalf(list, "odd")).toEqual([1, 3, 5]);
    expect(pickHalf(list, "even")).toEqual([2, 4]);
    expect(pickHalf(list, "all")).toEqual(list);
  });
});
