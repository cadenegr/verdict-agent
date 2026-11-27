// Reading live/verdicts.jsonl and live/evidence.jsonl: one checked line per product,
// bad lines counted, not fatal.
import { EvidenceSchema, VerdictLineSchema, type Evidence, type VerdictLine } from "@app/shared";

export function readVerdicts(text: string): { lines: VerdictLine[]; bad: number } {
  const lines: VerdictLine[] = [];
  let bad = 0;
  for (const raw of text.split("\n")) {
    if (raw.trim() === "") continue;
    try {
      const parsed = VerdictLineSchema.safeParse(JSON.parse(raw));
      if (parsed.success) lines.push(parsed.data);
      else bad += 1;
    } catch {
      bad += 1;
    }
  }
  return { lines, bad };
}

/** The raw evidence saved by the last runs, by product URL: re-judging needs no network. */
export function readEvidence(text: string): { byUrl: Map<string, Evidence>; bad: number } {
  const byUrl = new Map<string, Evidence>();
  let bad = 0;
  for (const raw of text.split("\n")) {
    if (raw.trim() === "") continue;
    try {
      const parsed = EvidenceSchema.safeParse(JSON.parse(raw));
      if (parsed.success) byUrl.set(parsed.data.url, parsed.data);
      else bad += 1;
    } catch {
      bad += 1;
    }
  }
  return { byUrl, bad };
}
