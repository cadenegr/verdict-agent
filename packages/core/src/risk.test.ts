import { describe, expect, it } from "vitest";
import { EvidenceSchema, type SearchHit } from "@app/shared";
import { namesProduct, riskSignals } from "./risk.ts";

const now = new Date("2026-11-27T12:00:00Z");

const hit = (query: string, title: string, year: number | null = 2025): SearchHit => ({
  query,
  title,
  url: "https://news.example.org/story",
  year,
});

const evidence = (search: SearchHit[]) =>
  EvidenceSchema.parse({
    url: "https://example.com",
    finalUrl: "https://example.com/",
    fetchedAt: now.toISOString(),
    copyrightYear: 2026,
    deadLinks: { checked: 0, dead: 0, examples: [] },
    docs: null,
    wayback: { first: null, last: null },
    search,
    links: [],
    errors: [],
    durationMs: 0,
  });

const flagOf = (search: SearchHit[]) => riskSignals(evidence(search), now).map((s) => s.flag);

describe("riskSignals", () => {
  it("keeps red for a shutdown, a regulator's fine or a privacy violation", () => {
    expect(flagOf([hit('"Acme" shut down', "Acme shuts down its cloud")])).toEqual(["red"]);
    expect(flagOf([hit('"Acme" fined by regulator', "FTC fines Acme $1M")])).toEqual(["red"]);
    expect(flagOf([hit('"Acme" privacy violation', "Acme broke GDPR, DPA says")])).toEqual(["red"]);
  });

  it("ignores privacy policies, year-end news and lawsuits under the red topics", () => {
    const policy = hit('"Acme" privacy violation', "Privacy Policy | Acme Software");
    const yearEnd = hit('"Acme" shut down', "Acme Closes 2025 After Record Growth");
    const suit = hit('"Acme" fined by regulator', "Acme sued by competition regulator");
    expect(flagOf([policy, yearEnd, suit])).toEqual([]);
  });

  it("turns a warning of a fine into a doubt", () => {
    const warning = hit('"Acme" fined by regulator', "EU warns Acme it could be fined billions");
    expect(riskSignals(evidence([warning]), now)).toEqual([
      expect.objectContaining({ flag: "yellow", weight: -0.5 }),
    ]);
  });

  it("counts a data breach as a doubt at half weight", () => {
    const signals = riskSignals(
      evidence([hit('"Acme" data breach', "Acme breach exposes data")]),
      now,
    );
    expect(signals).toEqual([expect.objectContaining({ flag: "yellow", weight: -0.5 })]);
  });

  it("ignores a title that only asks a question", () => {
    const question = hit('"Acme" privacy violation', "Is Acme violating GDPR by asking for logs?");
    expect(flagOf([question])).toEqual([]);
  });

  it("needs private-equity words, not 'equity' alone", () => {
    expect(flagOf([hit('"Acme" private equity', "Acme Equity overview (PitchBook)")])).toEqual([]);
    expect(flagOf([hit('"Acme" private equity', "Thoma Bravo buys Acme")])).toEqual(["yellow"]);
  });

  it("finds a rename as a doubt", () => {
    expect(flagOf([hit('"Acme" renamed', "Acme rebrands as Zenith")])).toEqual(["yellow"]);
    expect(flagOf([hit('"Acme" renamed', "Acme ships version 5")])).toEqual([]);
  });

  it("reads old evidence without churn phrases", () => {
    expect(evidence([]).churn).toEqual([]);
  });
});

describe("namesProduct", () => {
  it("matches the whole name, or a long enough first word", () => {
    const q = (name: string, title: string) => namesProduct(hit(`"${name}" lawsuit`, title, null));
    expect(q("AnyDesk", "AnyDesk confirms breach")).toBe(true);
    expect(q("Microsoft 365 Copilot", "Microsoft sued over Copilot")).toBe(true);
    expect(q("R", "Rust raises funds")).toBe(false);
    expect(q("Acme", "Unrelated story")).toBe(false);
  });

  it("reads a query echoed back without its opening quote", () => {
    const echoed = hit(
      'Bending Spoons portfolio, " acquired',
      "WeTransfer acquired by Bending Spoons",
    );
    expect(namesProduct(echoed)).toBe(true);
    const unquoted = hit("DoNotPay (AI lawyer) fined by regulator", "FTC fines DoNotPay $193,000");
    expect(namesProduct(unquoted)).toBe(true);
    expect(namesProduct(hit("Acme lawsuit", "Big Tech faces new lawsuit"))).toBe(false);
  });
});
