// Rules that turn the evidence for one product into a verdict.
// Pure functions: the clock comes in as `now`.
import {
  MAX_DEAD_LINK_SHARE,
  MIN_CONFIDENCE,
  RISK_TOPICS,
  STALE_SNAPSHOT_DAYS,
  YOUNG_SITE_DAYS,
  type Evidence,
  type ProductVerdict,
  type VerdictEvidence,
} from "@app/shared";
import { isSameSite } from "./evidence.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

/** One observation. weight > 0 says "alive", weight < 0 says "dead". */
export interface Signal extends VerdictEvidence {
  weight: number;
  /** True when the signal says the site is young (polished but thin). */
  young?: boolean;
}

/** Search topics that point to the end of a product, and how much they weigh. */
const SEARCH_WEIGHTS: Readonly<Partial<Record<(typeof RISK_TOPICS)[number], number>>> = {
  "shut down": -1,
  acquired: -0.5,
};

/** Reads the capture time from a Wayback link (`/web/20201231235959/...`). */
export function snapshotDate(link: string): Date | null {
  const match = /\/web\/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(link);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match.map(Number);
  return new Date(Date.UTC(y!, mo! - 1, d!, h!, mi!, s!));
}

function daysBetween(earlier: Date, later: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / DAY_MS);
}

function homeSignals(evidence: Evidence): Signal[] {
  if (evidence.finalUrl === null) {
    return [{ url: evidence.url, kind: "home", note: "Home page did not load", weight: -3 }];
  }
  if (!isSameSite(evidence.finalUrl, evidence.url)) {
    return [
      {
        url: evidence.finalUrl,
        kind: "moved",
        note: `Home page redirects to another site: ${new URL(evidence.finalUrl).hostname}`,
        weight: -2,
      },
    ];
  }
  return [{ url: evidence.finalUrl, kind: "home", note: "Home page loads", weight: 1 }];
}

function linkSignals(evidence: Evidence): Signal[] {
  const signals: Signal[] = [];
  const { checked, dead, examples } = evidence.deadLinks;
  const firstDead = examples[0];
  if (checked > 0 && dead / checked > MAX_DEAD_LINK_SHARE && firstDead) {
    signals.push({
      url: firstDead.url,
      kind: "dead-links",
      note: `${dead} of ${checked} checked links are dead`,
      weight: -1,
    });
  }
  if (evidence.docs !== null) {
    signals.push({
      url: evidence.docs,
      kind: "docs",
      note: "Help centre or docs found",
      weight: 1,
    });
  }
  return signals;
}

function waybackSignals(evidence: Evidence, now: Date): Signal[] {
  const signals: Signal[] = [];
  const { first, last } = evidence.wayback;
  const lastDate = last === null ? null : snapshotDate(last);
  if (last !== null && lastDate !== null) {
    const age = daysBetween(lastDate, now);
    const stale = age > STALE_SNAPSHOT_DAYS;
    signals.push({
      url: last,
      kind: "wayback-last",
      note: stale ? `Last archived ${age} days ago` : "Archived within the last year",
      weight: stale ? -2 : 1,
    });
  }
  const firstDate = first === null ? null : snapshotDate(first);
  if (first !== null && firstDate !== null) {
    const age = daysBetween(firstDate, now);
    const young = age < YOUNG_SITE_DAYS;
    signals.push({
      url: first,
      kind: "wayback-first",
      note: young ? `First archived only ${age} days ago` : `First archived ${age} days ago`,
      weight: young ? 0 : 1,
      young,
    });
  }
  return signals;
}

function searchSignals(evidence: Evidence): Signal[] {
  const signals: Signal[] = [];
  for (const topic of RISK_TOPICS) {
    const weight = SEARCH_WEIGHTS[topic];
    if (weight === undefined) continue;
    // The query is `"<name>" <topic>`: match the end, so a product named "Acquired" is not hit.
    const hit = evidence.search.find((h) => h.query.toLowerCase().endsWith(` ${topic}`));
    if (hit) {
      signals.push({ url: hit.url, kind: "search", note: `"${topic}": ${hit.title}`, weight });
    }
  }
  return signals;
}

/** Every observation the rules make about one product. */
export function collectSignals(evidence: Evidence, now: Date): Signal[] {
  return [
    ...homeSignals(evidence),
    ...linkSignals(evidence),
    ...waybackSignals(evidence, now),
    ...searchSignals(evidence),
  ];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Adds the signals up. Alive and dead weight are compared; the share of the
 * winning side is the confidence. A young site that looks alive is `doubt`,
 * and a weak lead is `unsure` rather than a guess.
 */
export function judge(evidence: Evidence, now: Date): ProductVerdict {
  const signals = collectSignals(evidence, now);
  const alive = signals.reduce((sum, s) => sum + Math.max(s.weight, 0), 0);
  const dead = signals.reduce((sum, s) => sum + Math.max(-s.weight, 0), 0);
  const links = signals.map(({ url, kind, note }) => ({ url, kind, note }));
  const total = alive + dead;
  // Defensive: homeSignals always adds a signal, so total is never 0 today.
  if (total === 0) {
    return { product: evidence.url, verdict: "unsure", confidence: 0, evidence: links };
  }
  const confidence = round2(Math.max(alive, dead) / total);
  const lean = alive >= dead ? "trust" : "dead";
  const young = signals.some((s) => s.young === true);
  const verdict =
    confidence < MIN_CONFIDENCE ? "unsure" : lean === "trust" && young ? "doubt" : lean;
  return { product: evidence.url, verdict, confidence, evidence: links };
}
