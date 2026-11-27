import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EvidenceSchema, MAX_PAGES_PER_PRODUCT } from "@app/shared";
import { collectEvidence } from "./collect.ts";
import { createFetcher } from "./http.ts";
import { claudeSearch, parseHits } from "./search/claude.ts";

const recorded = (name: string) =>
  readFileSync(new URL(`../../../packages/core/src/__fixtures__/${name}`, import.meta.url), "utf8");

/** A fake network: the recorded Keybase page, one dead link, and the recorded CDX reply. */
function fakeFetch(calls: string[]): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (url === "https://keybase.io/") return new Response(recorded("keybase.io.html"));
    if (url.startsWith("https://web.archive.org/cdx/"))
      return new Response(recorded("cdx-linear.app.json"));
    if (url === "https://keybase.io/docs/secadv") return new Response("gone", { status: 404 });
    return new Response("ok");
  }) as typeof fetch;
}

const noWait = { sleep: async () => {}, clock: () => 0 };

describe("collectEvidence", () => {
  it("builds a valid record from recorded responses, within the page budget", async () => {
    const calls: string[] = [];
    const site = createFetcher({
      maxRequests: MAX_PAGES_PER_PRODUCT,
      timeoutMs: 1000,
      fetch: fakeFetch(calls),
      ...noWait,
    });
    const archive = createFetcher({
      maxRequests: null,
      timeoutMs: 1000,
      fetch: fakeFetch(calls),
      ...noWait,
    });
    const search = claudeSearch(
      async () => '[{"query":"q","title":"t","url":"https://news.org/k"}]',
    );

    const evidence = await collectEvidence("https://keybase.io/", {
      site,
      archive,
      search,
      now: () => new Date("2026-11-26T18:00:00Z"),
      clock: () => 0,
    });

    expect(EvidenceSchema.safeParse(evidence).success).toBe(true);
    expect(evidence.copyrightYear).toBe(2026);
    expect(evidence.docs).toBe("https://keybase.io/docs");
    expect(evidence.deadLinks.checked).toBe(site.used - 1);
    expect(site.used).toBeLessThanOrEqual(MAX_PAGES_PER_PRODUCT);
    expect(evidence.deadLinks.dead).toBe(1);
    expect(evidence.wayback.first).toBe(
      "https://web.archive.org/web/20190418214204/https://linear.app/",
    );
    expect(evidence.links.length).toBeGreaterThanOrEqual(5);
    expect(evidence.errors).toEqual([]);
  });
});

describe("createFetcher", () => {
  it("waits between requests to the same host and stops at the cap", async () => {
    const waits: number[] = [];
    let now = 0;
    const fetcher = createFetcher({
      maxRequests: 2,
      timeoutMs: 1000,
      minGapMs: 1000,
      fetch: (async () => new Response("ok")) as typeof fetch,
      sleep: async (ms) => {
        waits.push(ms);
        now += ms;
      },
      clock: () => now,
    });
    await fetcher.get("https://a.com/1");
    await fetcher.get("https://a.com/2");
    const third = await fetcher.get("https://a.com/3");
    expect(waits).toEqual([1000]);
    expect(third.error).toBe("page budget used up");
  });

  it("reports a failed request as status null", async () => {
    const fetcher = createFetcher({
      maxRequests: null,
      timeoutMs: 1000,
      fetch: (async () => {
        throw new Error("getaddrinfo ENOTFOUND");
      }) as typeof fetch,
      ...noWait,
    });
    expect(await fetcher.get("https://gone.example/")).toMatchObject({
      status: null,
      error: "getaddrinfo ENOTFOUND",
    });
  });
});

describe("search adapters", () => {
  it("keeps only valid hits from a chatty reply", () => {
    const reply =
      'Here you go:\n[{"query":"q","title":"t","url":"https://a.org/"},{"title":"no url"}]';
    expect(parseHits(reply)).toEqual([
      { query: "q", title: "t", url: "https://a.org/", year: null },
    ]);
    expect(parseHits("no results")).toEqual([]);
    const dated = '[{"query":"q","title":"t","url":"https://a.org/","year":2025}]';
    expect(parseHits(dated)[0]?.year).toBe(2025);
  });

  it("turns a failed claude call into an error, not a crash", async () => {
    const search = claudeSearch(async () => {
      throw new Error("timed out");
    });
    expect(await search.search(["q"])).toEqual({ hits: [], error: "search: timed out" });
  });
});
