// Search through Claude Code's web search (`claude -p`). Uses the owner's token budget: opt in.
import { SearchHitSchema } from "@app/shared";
import { runClaude, type Runner } from "../claude.ts";
import type { SearchProvider } from "./provider.ts";

export type { Runner } from "../claude.ts";

function prompt(queries: readonly string[]): string {
  return [
    "Run a web search for each query below. For each, keep at most 3 results that are really about it.",
    'Answer with only a JSON array, no prose: [{"query": "...", "title": "...", "url": "https://...", "year": 2024}].',
    'Set "year" to the year the page was published, or null when the result does not show it.',
    "Use only URLs that appeared in the search results. An empty array is a fine answer.",
    ...queries.map((query) => `- ${query}`),
  ].join("\n");
}

/** The first JSON array in the reply, checked against the schema; bad items are dropped. */
export function parseHits(reply: string) {
  const start = reply.indexOf("[");
  const end = reply.lastIndexOf("]");
  if (start === -1 || end < start) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(reply.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item: unknown) => {
    const hit = SearchHitSchema.safeParse(item);
    return hit.success ? [hit.data] : [];
  });
}

// Nine risk topics in one call: give the searches time (90 s was enough for four).
export function claudeSearch(run: Runner = runClaude, timeoutMs = 180_000): SearchProvider {
  return {
    name: "claude",
    async search(queries) {
      const args = ["-p", prompt(queries), "--model", "haiku", "--allowedTools", "WebSearch"];
      try {
        return { hits: parseHits(await run(args, timeoutMs)), error: null };
      } catch (error) {
        return {
          hits: [],
          error: `search: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  };
}
