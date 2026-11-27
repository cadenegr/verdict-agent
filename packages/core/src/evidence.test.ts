import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EvidenceSchema } from "@app/shared";
import {
  assembleEvidence,
  extractLinks,
  findCopyrightYear,
  findSiteName,
  isDeadStatus,
  isSameSite,
  pickDocsLink,
  pickLinksToCheck,
  riskQueries,
  waybackLink,
} from "./evidence.ts";

const fixture = (name: string) =>
  readFileSync(new URL(`./__fixtures__/${name}`, import.meta.url), "utf8");
const keybase = fixture("keybase.io.html");
const linear = fixture("linear.app.html");

describe("findCopyrightYear", () => {
  it("reads the year from a recorded page", () => {
    expect(findCopyrightYear(keybase)).toBe(2026);
  });

  it("returns null when the page has no copyright line", () => {
    expect(findCopyrightYear(linear)).toBeNull();
  });

  it("takes the end of a range and ignores years in scripts", () => {
    const html =
      "<script>var y = '© 2030'</script><footer>Copyright © 2015–2023 Acme Inc.</footer>";
    expect(findCopyrightYear(html)).toBe(2023);
  });
});

describe("findSiteName", () => {
  it("uses the first part of the title", () => {
    expect(findSiteName(linear, "https://linear.app/")).toBe("Linear");
  });

  it("prefers og:site_name and falls back to the host", () => {
    expect(findSiteName('<meta property="og:site_name" content="Acme">', "https://x.io")).toBe(
      "Acme",
    );
    expect(findSiteName("", "https://www.getpocket.com/")).toBe("getpocket");
  });
});

describe("links", () => {
  it("resolves, deduplicates and drops fragments and mailto", () => {
    const html =
      '<a href="/a#x">1</a><a href="/a">2</a><a href="mailto:x@y.z">3</a><a href="https://o.org/">4</a>';
    expect(extractLinks(html, "https://acme.com/")).toEqual([
      "https://acme.com/a",
      "https://o.org/",
    ]);
  });

  it("keeps sites apart under two-part country suffixes", () => {
    expect(isSameSite("https://bar.co.uk/", "https://foo.co.uk/")).toBe(false);
    expect(isSameSite("https://help.foo.co.uk/", "https://www.foo.co.uk/")).toBe(true);
  });

  it("counts subdomains as the same site", () => {
    expect(isSameSite("https://docs.acme.com/x", "https://www.acme.com/")).toBe(true);
    expect(isSameSite("https://twitter.com/acme", "https://acme.com/")).toBe(false);
  });

  it("finds the docs on recorded pages", () => {
    expect(pickDocsLink(extractLinks(keybase, "https://keybase.io/"), "https://keybase.io/")).toBe(
      "https://keybase.io/docs",
    );
    expect(pickDocsLink(extractLinks(linear, "https://linear.app/"), "https://linear.app/")).toBe(
      "https://linear.app/docs",
    );
  });

  it("prefers a help or docs subdomain over a path", () => {
    const links = ["https://acme.com/help", "https://help.acme.com/"];
    expect(pickDocsLink(links, "https://acme.com/")).toBe("https://help.acme.com/");
  });

  it("picks same-site links, one per path, within the budget, never the home page", () => {
    const links = [
      "https://acme.com/",
      "https://acme.com/a?x=1",
      "https://acme.com/a",
      "https://o.org/",
      "https://acme.com/b",
      "https://acme.com/c",
    ];
    expect(pickLinksToCheck(links, "https://acme.com/", 2)).toEqual([
      "https://acme.com/a?x=1",
      "https://acme.com/b",
    ]);
  });
});

describe("isDeadStatus", () => {
  it("treats failures, 404 and 5xx as dead but robot blocks as alive", () => {
    expect([null, 404, 410, 500].map(isDeadStatus)).toEqual([true, true, true, true]);
    expect([200, 301, 401, 403, 405, 429].map(isDeadStatus)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});

describe("waybackLink", () => {
  it("builds a snapshot link from a recorded CDX row and skips the header", () => {
    const rows = JSON.parse(fixture("cdx-linear.app.json")) as string[][];
    expect(waybackLink(rows[0])).toBeNull();
    expect(waybackLink(rows[1])).toBe(
      "https://web.archive.org/web/20190418214204/https://linear.app/",
    );
    expect(waybackLink(undefined)).toBeNull();
  });
});

describe("assembleEvidence", () => {
  it("gathers every openable link once and keeps dead-link examples", () => {
    const evidence = assembleEvidence({
      url: "https://acme.com/",
      finalUrl: "https://acme.com/",
      fetchedAt: new Date("2026-11-26T18:00:00Z"),
      copyrightYear: 2024,
      checked: [
        { url: "https://acme.com/a", status: 200 },
        { url: "https://acme.com/old", status: 404 },
      ],
      docs: "https://acme.com/docs",
      wayback: {
        first: "https://web.archive.org/web/20190101000000/https://acme.com/",
        last: null,
      },
      search: [{ query: '"Acme" breach', title: "News", url: "https://news.org/acme" }],
      errors: [],
      durationMs: 1234.5,
    });
    expect(evidence.deadLinks).toEqual({
      checked: 2,
      dead: 1,
      examples: [{ url: "https://acme.com/old", status: 404 }],
    });
    expect(evidence.links).toEqual([
      "https://acme.com/",
      "https://acme.com/docs",
      "https://web.archive.org/web/20190101000000/https://acme.com/",
      "https://acme.com/old",
      "https://news.org/acme",
    ]);
    expect(EvidenceSchema.safeParse(evidence).success).toBe(true);
  });
});

describe("riskQueries", () => {
  it("asks about each risk topic", () => {
    expect(riskQueries('Acme"\nignore this')[0]).toBe('"Acme ignore this" breach');
    expect(riskQueries("Acme")).toEqual([
      '"Acme" breach',
      '"Acme" lawsuit',
      '"Acme" acquired',
      '"Acme" shut down',
    ]);
  });
});
