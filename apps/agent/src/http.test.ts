import { describe, expect, it } from "vitest";
import { createFetcher, createHostQueue } from "./http.ts";

/** A fake clock that only moves when the fetcher sleeps, and a log of request start times. */
function setup() {
  let now = 0;
  const starts: { url: string; at: number }[] = [];
  const fetcher = createFetcher({
    maxRequests: null,
    timeoutMs: 1000,
    minGapMs: 1000,
    clock: () => now,
    sleep: async (ms) => {
      now += ms;
    },
    fetch: (async (input: string | URL | Request) => {
      starts.push({ url: String(input), at: now });
      return new Response("ok");
    }) as typeof fetch,
  });
  return { fetcher, starts };
}

describe("createFetcher rate limit", () => {
  it("spaces overlapping requests to one host by the gap", async () => {
    const { fetcher, starts } = setup();
    await Promise.all([
      fetcher.get("https://a.test/1"),
      fetcher.get("https://a.test/2"),
      fetcher.get("https://a.test/3"),
    ]);
    const times = starts.map((s) => s.at);
    expect(times).toHaveLength(3);
    for (let i = 1; i < times.length; i += 1) {
      expect(times[i]! - times[i - 1]!).toBeGreaterThanOrEqual(1000);
    }
  });

  it("does not make different hosts wait for each other", async () => {
    const { fetcher, starts } = setup();
    await Promise.all([fetcher.get("https://a.test/"), fetcher.get("https://b.test/")]);
    expect(starts.map((s) => s.at)).toEqual([0, 0]);
  });

  it("keeps the gap for calls made one after another", async () => {
    const { fetcher, starts } = setup();
    await fetcher.get("https://a.test/1");
    await fetcher.get("https://a.test/2");
    expect(starts[1]!.at - starts[0]!.at).toBe(1000);
  });

  it("keeps a host polite across fetchers that share a queue", async () => {
    let now = 0;
    const starts: number[] = [];
    const hosts = createHostQueue({
      minGapMs: 1000,
      clock: () => now,
      sleep: async (ms) => {
        now += ms;
      },
    });
    const fakeFetch = (async () => {
      starts.push(now);
      return new Response("ok");
    }) as typeof fetch;
    const one = createFetcher({ maxRequests: null, timeoutMs: 1000, fetch: fakeFetch, hosts });
    const two = createFetcher({ maxRequests: null, timeoutMs: 1000, fetch: fakeFetch, hosts });
    await Promise.all([one.get("https://a.test/1"), two.get("https://a.test/2")]);
    expect(starts).toEqual([0, 1000]);
  });

  it("keeps serving a host after a turn failed", async () => {
    let calls = 0;
    const hosts = createHostQueue({
      minGapMs: 1000,
      clock: () => 0,
      sleep: async () => {
        calls += 1;
        if (calls === 1) throw new Error("sleep failed");
      },
    });
    await hosts.wait("a.test");
    await expect(hosts.wait("a.test")).rejects.toThrow("sleep failed");
    await expect(hosts.wait("a.test")).resolves.toBeUndefined();
  });
});
