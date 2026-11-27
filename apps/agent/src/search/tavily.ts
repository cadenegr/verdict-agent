// Search through Tavily's API (https://docs.tavily.com). Reads TAVILY_API_KEY; costs Tavily
// credits (one per query), not the owner's Claude budget.
import { SearchHitSchema, type SearchHit } from "@app/shared";
import { mapWithLimit } from "../pool.ts";
import type { SearchProvider } from "./provider.ts";

const ENDPOINT = "https://api.tavily.com/search";
const RESULTS_PER_QUERY = 3;
/** Queries in flight at once: one product's ten topics, two at a time. */
const QUERIES_AT_ONCE = 2;
const TIMEOUT_MS = 30_000;

interface TavilyResult {
  title?: unknown;
  url?: unknown;
  published_date?: unknown;
}

/** The year from Tavily's `published_date` ("2024-05-01" or an RFC date), or null. */
function yearOf(date: unknown): number | null {
  if (typeof date !== "string") return null;
  const match = /\b(19|20)\d{2}\b/.exec(date);
  return match ? Number(match[0]) : null;
}

/** Tavily's reply for one query as search hits; items that don't fit the schema are dropped. */
export function parseTavily(query: string, body: unknown): SearchHit[] {
  const results = (body as { results?: unknown })?.results;
  if (!Array.isArray(results)) return [];
  return results.slice(0, RESULTS_PER_QUERY).flatMap((item: TavilyResult) => {
    const hit = SearchHitSchema.safeParse({
      query,
      title: item.title,
      url: item.url,
      year: yearOf(item.published_date),
    });
    return hit.success ? [hit.data] : [];
  });
}

export function tavilySearch(
  apiKey: string | undefined,
  fetchFn: typeof fetch = fetch,
): SearchProvider {
  async function one(query: string): Promise<SearchHit[]> {
    const response = await fetchFn(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ query, max_results: RESULTS_PER_QUERY, search_depth: "basic" }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
    return parseTavily(query, await response.json());
  }

  return {
    name: "tavily",
    async search(queries) {
      if (!apiKey) return { hits: [], error: "search: TAVILY_API_KEY is not set" };
      // A failed query loses only its own hits; the error marks the search as a gap.
      const failures: string[] = [];
      const perQuery = await mapWithLimit(queries, QUERIES_AT_ONCE, (query) =>
        one(query).catch((error: unknown) => {
          failures.push(error instanceof Error ? error.message : String(error));
          return [];
        }),
      );
      const error = failures.length
        ? `search: tavily ${failures.length} of ${queries.length} queries failed (${failures[0]})`
        : null;
      return { hits: perQuery.flat(), error };
    },
  };
}
