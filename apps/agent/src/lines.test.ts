import { describe, expect, it } from "vitest";
import { readEvidence } from "./lines.ts";

const record = {
  url: "https://example.com",
  finalUrl: "https://example.com/",
  fetchedAt: "2026-11-27T12:00:00.000Z",
  copyrightYear: 2026,
  deadLinks: { checked: 0, dead: 0, examples: [] },
  docs: null,
  wayback: { first: null, last: null },
  search: [],
  links: [],
  errors: [],
  durationMs: 10,
};

describe("readEvidence", () => {
  it("keys records by URL, keeps the last one, and counts bad lines", () => {
    const later = { ...record, copyrightYear: 2025 };
    const text = [JSON.stringify(record), "not json", "{}", JSON.stringify(later), ""].join("\n");
    const { byUrl, bad } = readEvidence(text);
    expect(bad).toBe(2);
    expect(byUrl.get("https://example.com")?.copyrightYear).toBe(2025);
    expect(byUrl.get("https://example.com")?.churn).toEqual([]);
  });
});
