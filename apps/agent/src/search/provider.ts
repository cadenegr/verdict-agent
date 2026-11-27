import type { SearchHit } from "@app/shared";

/** Web search behind one interface, so the provider can change without touching the agent. */
export interface SearchProvider {
  readonly name: string;
  /** Hits for the given queries. Never throws: failures come back in `error`. */
  search(queries: readonly string[]): Promise<{ hits: SearchHit[]; error: string | null }>;
}

export const noSearch: SearchProvider = {
  name: "none",
  search: async () => ({ hits: [], error: null }),
};
