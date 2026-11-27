import { z } from "zod";

/** Politeness limits for one product (work order 1.2). */
export const MAX_PAGES_PER_PRODUCT = 15;
export const MIN_MS_BETWEEN_REQUESTS_PER_HOST = 1000;
export const DEAD_LINK_EXAMPLES = 5;

/**
 * The search topics that hint a product is in trouble. The first four are what
 * Stackgini rates Red (fines, breaches, privacy, the end of a product); the rest
 * are what it rates Yellow (ownership and leadership churn, legal fights, legacy).
 */
export const RISK_TOPICS = [
  "shut down",
  "data breach",
  "fined by regulator",
  "privacy violation",
  "lawsuit",
  "acquired",
  "private equity",
  "CEO steps down",
  "discontinued",
] as const;

export type RiskTopic = (typeof RISK_TOPICS)[number];

/** A hit older than this many years still counts, but only as a doubt (yellow). */
export const RISK_HIT_MAX_AGE_YEARS = 3;

/** This many yellow risk hits make a live product `doubt`. */
export const MIN_YELLOW_RISKS = 2;

export const SearchHitSchema = z.object({
  query: z.string(),
  title: z.string(),
  url: z.url(),
  /** Year the page was published, when the search shows it. */
  year: z.number().int().min(1990).max(2100).nullable().default(null),
});

export const DeadLinkSchema = z.object({
  url: z.url(),
  /** HTTP status, or null when the request failed (DNS, timeout, ...). */
  status: z.number().int().nullable(),
});

export const EvidenceSchema = z.object({
  url: z.url(),
  /** The home page after redirects: a product that moved shows up here. */
  finalUrl: z.url().nullable(),
  fetchedAt: z.iso.datetime(),
  copyrightYear: z.number().int().nullable(),
  deadLinks: z.object({
    checked: z.number().int().nonnegative(),
    dead: z.number().int().nonnegative(),
    examples: z.array(DeadLinkSchema),
  }),
  docs: z.url().nullable(),
  wayback: z.object({
    first: z.url().nullable(),
    last: z.url().nullable(),
  }),
  search: z.array(SearchHitSchema),
  /** Every link a human can open to check this record. */
  links: z.array(z.url()),
  errors: z.array(z.string()),
  durationMs: z.number().int().nonnegative(),
});

export type SearchHit = z.infer<typeof SearchHitSchema>;
export type DeadLink = z.infer<typeof DeadLinkSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
