import { z } from "zod";

/** The four calls the agent can make about a product. */
export const VERDICTS = ["trust", "doubt", "dead", "unsure"] as const;

/** Below this confidence the agent says `unsure` instead of guessing. */
export const MIN_CONFIDENCE = 0.55;

/** A site whose last Wayback snapshot is older than this looks abandoned. */
export const STALE_SNAPSHOT_DAYS = 365;

/** A site first archived less than this ago is young. */
export const YOUNG_SITE_DAYS = 365;

/** Share of checked links that may be dead before it counts against the site. */
export const MAX_DEAD_LINK_SHARE = 0.3;

export const VerdictSchema = z.enum(VERDICTS);

export const EVIDENCE_KINDS = [
  "home",
  "moved",
  "dead-links",
  "docs",
  "wayback-first",
  "wayback-last",
  "search",
] as const;

export const VerdictEvidenceSchema = z.object({
  url: z.url(),
  kind: z.enum(EVIDENCE_KINDS),
  /** One line a human can check by opening the link. */
  note: z.string().min(1),
});

/** One line of `verdicts.jsonl`: plain data, converted to the organizers' format later. */
export const ProductVerdictSchema = z.object({
  product: z.url(),
  verdict: VerdictSchema,
  confidence: z.number().min(0).max(1),
  evidence: z.array(VerdictEvidenceSchema),
});

export type Verdict = z.infer<typeof VerdictSchema>;
export type VerdictEvidence = z.infer<typeof VerdictEvidenceSchema>;
export type ProductVerdict = z.infer<typeof ProductVerdictSchema>;
