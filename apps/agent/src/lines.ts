// Reading live/verdicts.jsonl: one checked line per product, bad lines counted, not fatal.
import { VerdictLineSchema, type VerdictLine } from "@app/shared";

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
