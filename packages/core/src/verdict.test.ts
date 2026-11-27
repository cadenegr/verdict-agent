import { describe, expect, it } from "vitest";
import { ProductVerdictSchema, type SearchHit } from "@app/shared";
import { assembleEvidence, type EvidenceParts } from "./evidence.ts";
import { namesProduct } from "./risk.ts";
import { collectSignals, judge, snapshotDate } from "./verdict.ts";

const now = new Date("2026-11-27T12:00:00Z");
const wb = (stamp: string, host = "example.com") =>
  `https://web.archive.org/web/${stamp}/https://${host}/`;

function evidence(overrides: Partial<EvidenceParts> = {}) {
  return assembleEvidence({
    url: "https://example.com",
    finalUrl: "https://example.com/",
    fetchedAt: now,
    copyrightYear: 2026,
    checked: [],
    docs: "https://docs.example.com/",
    wayback: { first: wb("20150101000000"), last: wb("20261120000000") },
    search: [],
    errors: [],
    durationMs: 1000,
    ...overrides,
  });
}

const hit = (query: string, year: number | null = null, title?: string): SearchHit => ({
  query,
  title: title ?? `News about ${query}`,
  url: "https://news.example.org/story",
  year,
});

describe("snapshotDate", () => {
  it("reads the capture time from a Wayback link", () => {
    expect(snapshotDate(wb("20210115083000"))?.toISOString()).toBe("2021-01-15T08:30:00.000Z");
  });

  it("returns null for a link without a timestamp", () => {
    expect(snapshotDate("https://example.com/")).toBeNull();
  });
});

describe("judge", () => {
  it("trusts an old, maintained site with docs", () => {
    const result = judge(evidence(), now);
    expect(result.verdict).toBe("trust");
    expect(result.confidence).toBe(1);
    expect(ProductVerdictSchema.parse(result)).toEqual(result);
  });

  it("calls a site dead when it redirects elsewhere and stopped being archived", () => {
    const result = judge(
      evidence({
        url: "https://www.wunderlist.com",
        finalUrl: "https://to-do.office.com/",
        docs: null,
        wayback: { first: wb("20110101000000"), last: wb("20210101000000") },
      }),
      now,
    );
    expect(result.verdict).toBe("dead");
    expect(result.evidence.map((e) => e.kind)).toContain("moved");
  });

  it("calls a site dead when the home page does not load", () => {
    const result = judge(
      evidence({ finalUrl: null, docs: null, wayback: { first: null, last: null } }),
      now,
    );
    expect(result).toMatchObject({ verdict: "dead", confidence: 1 });
  });

  it("doubts a young site that otherwise looks alive", () => {
    const result = judge(
      evidence({ wayback: { first: wb("20260601000000"), last: wb("20261120000000") } }),
      now,
    );
    expect(result.verdict).toBe("doubt");
  });

  it("is unsure when alive and dead signals are close", () => {
    // alive: home 1 + docs 1; dead: "shut down" 1 + dead links 1 → 2 of 4 = 0.5
    const result = judge(
      evidence({
        wayback: { first: null, last: null },
        search: [hit('"Example" shut down')],
        checked: [
          { url: "https://example.com/a", status: 404 },
          { url: "https://example.com/b", status: 200 },
        ],
      }),
      now,
    );
    expect(result).toMatchObject({ verdict: "unsure", confidence: 0.5 });
  });

  it("counts many dead links against the site, with an example to open", () => {
    const checked = [
      { url: "https://example.com/a", status: 404 },
      { url: "https://example.com/b", status: 404 },
      { url: "https://example.com/c", status: 200 },
    ];
    const signals = collectSignals(evidence({ checked }), now);
    expect(signals).toContainEqual(
      expect.objectContaining({ kind: "dead-links", url: "https://example.com/a", weight: -1 }),
    );
  });

  it("counts a stale archive against the site", () => {
    // alive: home 1 + docs 1 + first snapshot 1 = 3; dead: last snapshot 2 → 3 of 5 = 0.6
    const result = judge(
      evidence({ wayback: { first: wb("20150101000000"), last: wb("20230101000000") } }),
      now,
    );
    expect(result).toMatchObject({ verdict: "trust", confidence: 0.6 });
    const stale = judge(
      evidence({ docs: null, wayback: { first: null, last: wb("20230101000000") } }),
      now,
    );
    // alive: home 1; dead: last snapshot 2 → 0.67
    expect(stale).toMatchObject({ verdict: "dead", confidence: 0.67 });
  });

  it("weighs an acquisition hit at -0.5", () => {
    const signals = collectSignals(evidence({ search: [hit('"Example" acquired')] }), now);
    expect(signals).toContainEqual(expect.objectContaining({ kind: "search", weight: -0.5 }));
    // alive: home 1 + docs 1 + both snapshots 2 = 4; dead 0.5 → 0.89
    expect(judge(evidence({ search: [hit('"Example" acquired')] }), now).confidence).toBe(0.89);
  });

  it("matches the topic, not the product name, in a search query", () => {
    const signals = collectSignals(evidence({ search: [hit('"Acquired Labs" breach')] }), now);
    expect(signals.some((s) => s.kind === "search")).toBe(false);
  });

  it("is unsure when only the home page speaks for the product", () => {
    const result = judge(evidence({ docs: null, wayback: { first: null, last: null } }), now);
    expect(result).toMatchObject({ verdict: "unsure", confidence: 1 });
  });

  it("caps the confidence and records a gap when a lookup failed", () => {
    const result = judge(evidence({ errors: ["wayback: status 429"] }), now);
    expect(result).toMatchObject({ verdict: "trust", confidence: 0.6 });
    expect(result.evidence).toContainEqual({
      url: "https://example.com",
      kind: "gap",
      note: "Not checked: wayback: status 429",
      flag: "yellow",
    });
  });

  it("does not treat a failed home page as a gap: it stays a clear dead call", () => {
    const result = judge(
      evidence({
        finalUrl: null,
        docs: null,
        wayback: { first: null, last: null },
        errors: ["home: status 503"],
      }),
      now,
    );
    expect(result).toMatchObject({ verdict: "dead", confidence: 1 });
    expect(result.evidence.some((e) => e.kind === "gap")).toBe(false);
  });

  it("does not count gaps as signals", () => {
    const result = judge(
      evidence({
        docs: null,
        wayback: { first: null, last: null },
        errors: ["wayback: timeout", "search: no key"],
      }),
      now,
    );
    expect(result.verdict).toBe("unsure");
  });

  it("flags each signal: green for, yellow doubt, red against", () => {
    const flags = (e: Parameters<typeof judge>[0]) =>
      Object.fromEntries(judge(e, now).evidence.map((item) => [item.kind, item.flag]));
    expect(flags(evidence())).toEqual({
      home: "green",
      docs: "green",
      "wayback-last": "green",
      "wayback-first": "green",
    });
    expect(flags(evidence({ search: [hit('"Example" shut down')] })).search).toBe("red");
    expect(flags(evidence({ search: [hit('"Example" acquired')] })).search).toBe("yellow");
    expect(flags(evidence({ finalUrl: null })).home).toBe("red");
  });

  it("raises a red flag for a recent fine, breach or privacy story", () => {
    for (const topic of ["fined by regulator", "data breach", "privacy violation"]) {
      const signals = collectSignals(evidence({ search: [hit(`"Example" ${topic}`, 2025)] }), now);
      expect(signals).toContainEqual(
        expect.objectContaining({ kind: "search", flag: "red", weight: -1 }),
      );
    }
  });

  it("turns a story older than three years into a yellow flag at half weight", () => {
    const signals = collectSignals(evidence({ search: [hit('"Example" data breach', 2019)] }), now);
    expect(signals).toContainEqual(
      expect.objectContaining({
        kind: "search",
        flag: "yellow",
        weight: -0.5,
        note: expect.stringContaining("(2019)"),
      }),
    );
  });

  it("ignores a hit whose title does not name the product", () => {
    const other = hit('"Example" lawsuit', 2025, "Big Tech faces new lawsuit");
    expect(
      collectSignals(evidence({ search: [other] }), now).some((s) => s.kind === "search"),
    ).toBe(false);
  });

  it("ignores a hit whose title names the product but not the topic", () => {
    const nearMiss = hit('"Example" shut down', 2025, "Example stops abruptly without warning");
    expect(
      collectSignals(evidence({ search: [nearMiss] }), now).some((s) => s.kind === "search"),
    ).toBe(false);
  });

  it("does not doubt a product for old stories", () => {
    const search = [hit('"Example" acquired', 2018), hit('"Example" CEO steps down', 2019)];
    expect(judge(evidence({ search }), now).verdict).toBe("trust");
  });

  it("doubts a live product with two yellow risk stories", () => {
    const search = [hit('"Example" acquired', 2025), hit('"Example" CEO steps down', 2026)];
    expect(judge(evidence({ search }), now).verdict).toBe("doubt");
    expect(judge(evidence({ search: search.slice(0, 1) }), now).verdict).toBe("trust");
  });

  it("gives every evidence item a link and a note", () => {
    const result = judge(evidence({ search: [hit('"Example" acquired')] }), now);
    for (const item of result.evidence) {
      expect(item.note.length).toBeGreaterThan(0);
      expect(() => new URL(item.url)).not.toThrow();
    }
  });
});

describe("namesProduct", () => {
  it("matches the whole name, or a long enough first word", () => {
    const q = (name: string, title: string) => namesProduct(hit(`"${name}" lawsuit`, null, title));
    expect(q("AnyDesk", "AnyDesk confirms breach")).toBe(true);
    expect(q("Microsoft 365 Copilot", "Microsoft sued over Copilot")).toBe(true);
    expect(q("R", "Rust raises funds")).toBe(false);
    expect(q("Acme", "Unrelated story")).toBe(false);
  });
});
