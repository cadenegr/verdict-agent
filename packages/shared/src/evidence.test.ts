import { describe, expect, it } from "vitest";
import { EvidenceSchema, SearchHitSchema } from "./evidence.ts";

const record = {
  url: "https://example.com/",
  finalUrl: "https://example.com/",
  fetchedAt: "2026-11-26T18:00:00.000Z",
  copyrightYear: 2026,
  deadLinks: { checked: 3, dead: 1, examples: [{ url: "https://example.com/old", status: 404 }] },
  docs: "https://example.com/docs",
  wayback: { first: "https://web.archive.org/web/2019/https://example.com/", last: null },
  search: [{ query: "Example breach", title: "News", url: "https://news.example.org/a" }],
  links: ["https://example.com/"],
  errors: [],
  durationMs: 1200,
};

describe("EvidenceSchema", () => {
  it("accepts a complete record", () => {
    expect(EvidenceSchema.safeParse(record).success).toBe(true);
  });

  it("rejects a record whose links are not URLs", () => {
    expect(EvidenceSchema.safeParse({ ...record, links: ["not a url"] }).success).toBe(false);
  });
});

describe("SearchHitSchema", () => {
  it("reads a hit without a year as year null", () => {
    const hit = SearchHitSchema.parse({ query: "q", title: "t", url: "https://x.example/" });
    expect(hit.year).toBeNull();
  });
});
