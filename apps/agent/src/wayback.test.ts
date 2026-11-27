import { describe, expect, it } from "vitest";
import type { Fetcher, PageResult } from "./http.ts";
import { findSnapshots, RETRY_AFTER_MS } from "./wayback.ts";

const cdx = (stamp: string) =>
  JSON.stringify([
    ["timestamp", "original"],
    [stamp, "https://example.com/"],
  ]);

/** Answers each call with the next status; 200 carries a CDX body. */
function fakeArchive(statuses: (number | null)[]): Fetcher & { calls: number } {
  const fake = {
    calls: 0,
    used: 0,
    async get(url: string): Promise<PageResult> {
      const status = fake.calls < statuses.length ? (statuses[fake.calls] as number | null) : 200;
      fake.calls += 1;
      const ok = status === 200;
      return {
        url,
        status,
        finalUrl: ok ? url : null,
        body: ok ? cdx("20200101000000") : null,
        error: status === null ? "timeout" : null,
      };
    },
  };
  return fake;
}

describe("findSnapshots", () => {
  it("retries once after a pause when the archive is busy", async () => {
    const archive = fakeArchive([429, 200, 503, 200]);
    const pauses: number[] = [];
    const result = await findSnapshots(archive, "https://example.com", async (ms) => {
      pauses.push(ms);
    });
    expect(result.error).toBeNull();
    expect(result.first).toContain("/web/20200101000000/");
    expect(archive.calls).toBe(4);
    expect(pauses).toEqual([RETRY_AFTER_MS, RETRY_AFTER_MS]);
  });

  it("reports the error when the retry fails too", async () => {
    const archive = fakeArchive([null, null, 200]);
    const result = await findSnapshots(archive, "https://example.com", async () => {});
    expect(result).toMatchObject({ first: null, error: "wayback: timeout" });
    expect(result.last).not.toBeNull();
  });

  it("does not retry a 404", async () => {
    const archive = fakeArchive([404, 200]);
    const result = await findSnapshots(archive, "https://example.com", async () => {});
    expect(result.error).toBe("wayback: status 404");
    expect(archive.calls).toBe(2);
  });
});
