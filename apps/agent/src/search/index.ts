import { claudeSearch } from "./claude.ts";
import { noSearch, type SearchProvider } from "./provider.ts";
import { tavilySearch } from "./tavily.ts";

export type { SearchProvider } from "./provider.ts";

/** The provider named by SEARCH_PROVIDER (none | claude | tavily). */
export function searchFromEnv(env: NodeJS.ProcessEnv): SearchProvider {
  const name = env.SEARCH_PROVIDER ?? "none";
  if (name === "claude") return claudeSearch();
  if (name === "tavily") return tavilySearch(env.TAVILY_API_KEY);
  if (name === "none") return noSearch;
  throw new Error(`Unknown SEARCH_PROVIDER "${name}": use none, claude or tavily.`);
}
