import type { SearchProvider } from "./provider.ts";

/** Placeholder until the event, where the Tavily key is expected. Reads TAVILY_API_KEY. */
export function tavilySearch(apiKey: string | undefined): SearchProvider {
  return {
    name: "tavily",
    search: async () => ({
      hits: [],
      error: apiKey
        ? "search: the Tavily adapter is not written yet"
        : "search: TAVILY_API_KEY is not set",
    }),
  };
}
