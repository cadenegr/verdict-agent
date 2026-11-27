import { describe, expect, it } from "vitest";
import { parseTavily, tavilySearch } from "./tavily.ts";

const reply = {
  results: [
    {
      title: "Acme fined by regulator",
      url: "https://news.example/a",
      published_date: "2024-05-01",
    },
    { title: "No date here", url: "https://news.example/b" },
    { title: "Bad url", url: "not a url" },
  ],
};

function fakeFetch(handler: (body: { query: string }) => Response): typeof fetch {
  return (async (_url: string, init: RequestInit) =>
    handler(JSON.parse(String(init.body)))) as unknown as typeof fetch;
}

describe("parseTavily", () => {
  it("keeps valid results with their year and drops the rest", () => {
    expect(parseTavily("q", reply)).toEqual([
      { query: "q", title: "Acme fined by regulator", url: "https://news.example/a", year: 2024 },
      { query: "q", title: "No date here", url: "https://news.example/b", year: null },
    ]);
  });

  it("returns nothing for a reply without results", () => {
    expect(parseTavily("q", { error: "bad" })).toEqual([]);
  });
});

describe("tavilySearch", () => {
  it("says so when the key is missing", async () => {
    const result = await tavilySearch(undefined).search(["q"]);
    expect(result).toEqual({ hits: [], error: "search: TAVILY_API_KEY is not set" });
  });

  it("keeps the hits of the queries that answered and reports the failed ones", async () => {
    const provider = tavilySearch(
      "key",
      fakeFetch(({ query }) =>
        query === "bad" ? new Response("", { status: 429 }) : Response.json(reply),
      ),
    );
    const result = await provider.search(["good", "bad"]);
    expect(result.hits.map((hit) => hit.query)).toEqual(["good", "good"]);
    expect(result.error).toBe("search: tavily 1 of 2 queries failed (status 429)");
  });
});
