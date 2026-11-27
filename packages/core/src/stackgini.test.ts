import { describe, expect, it } from "vitest";
import { StackginiRowSchema, type VerdictEvidence, type VerdictLine } from "@app/shared";
import { ratingOf, stackginiCsv, toStackgini } from "./stackgini.ts";

const home: VerdictEvidence = {
  url: "https://example.com/",
  kind: "home",
  note: "Home page loads",
  flag: "green",
};
const fine: VerdictEvidence = {
  url: "https://news.example.org/fine",
  kind: "search",
  note: '"fine": Regulator fines Example',
  flag: "red",
};
const gap: VerdictEvidence = {
  url: "https://example.com",
  kind: "gap",
  note: "Not checked: wayback: status 429",
  flag: "yellow",
};

const line = (verdict: VerdictLine["verdict"], evidence: VerdictEvidence[]): VerdictLine => ({
  name: "Example",
  product: "https://example.com",
  verdict,
  confidence: 0.8,
  evidence,
  checkedAt: "2026-11-27T12:00:00.000Z",
});

describe("ratingOf", () => {
  it("is green for trust, yellow for doubt and unsure, red for dead", () => {
    expect(ratingOf(line("trust", [home]))).toBe("green");
    expect(ratingOf(line("doubt", [home]))).toBe("yellow");
    expect(ratingOf(line("unsure", [home]))).toBe("yellow");
    expect(ratingOf(line("dead", [home]))).toBe("red");
  });

  it("is red when any evidence is a red flag, even for a live product", () => {
    expect(ratingOf(line("trust", [home, fine]))).toBe("red");
  });

  it("stays green with a yellow flag (Stackgini rates such products Green)", () => {
    expect(ratingOf(line("trust", [home, gap]))).toBe("green");
  });
});

describe("toStackgini", () => {
  it("fills the organizers' columns with the flags and their links", () => {
    const row = toStackgini(line("trust", [home, fine, gap]));
    expect(StackginiRowSchema.parse(row)).toEqual(row);
    expect(row).toMatchObject({
      url: "https://example.com",
      product: "Example",
      vendor: "",
      overall: "Red",
      green_flags: "Home page loads (https://example.com/)",
      yellow_flags: "None identified.",
      red_flags: '"fine": Regulator fines Example (https://news.example.org/fine)',
    });
    expect(row.reasoning).toContain("A red flag decides the rating.");
    expect(row.reasoning).toContain("Not checked: wayback: status 429");
  });

  it("says when there was not enough evidence", () => {
    expect(toStackgini(line("unsure", [home])).reasoning).toMatch(/^Not enough evidence/);
  });
});

describe("stackginiCsv", () => {
  it("writes the header and quotes every cell, doubling quotes", () => {
    const csv = stackginiCsv([toStackgini(line("trust", [home, fine]))]);
    const [header, first] = csv.trimEnd().split("\n");
    expect(header).toBe(
      '"url","product","vendor","overall","green_flags","yellow_flags","red_flags","reasoning"',
    );
    expect(first).toContain('"""fine"": Regulator fines Example');
  });
});
