// Rules that turn the evidence for one product into a verdict.
// Pure functions: the clock comes in as `now`.
import {
  GAP_MAX_CONFIDENCE,
  MAX_DEAD_LINK_SHARE,
  MIN_CONFIDENCE,
  MIN_SIGNALS,
  MIN_YELLOW_RISKS,
  STALE_SNAPSHOT_DAYS,
  YOUNG_SITE_DAYS,
  type Evidence,
  type ProductVerdict,
  type VerdictEvidence,
} from "@app/shared";
import { isSameSite } from "./evidence.ts";
import { riskSignals } from "./risk.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

/** One observation. weight > 0 says "alive", weight < 0 says "dead". */
export interface Signal extends VerdictEvidence {
  weight: number;
  /** True when the signal says the site is young (polished but thin). */
  young?: boolean;
  /** True for a search hit older than RISK_HIT_MAX_AGE_YEARS. */
  old?: boolean;
}

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
    return [
      { url: evidence.url, kind: "home", note: "Home page did not load", weight: -3, flag: "red" },
    ];
  }
  if (!isSameSite(evidence.finalUrl, evidence.url)) {
    return [
      {
        url: evidence.finalUrl,
        kind: "moved",
        note: `Home page redirects to another site: ${new URL(evidence.finalUrl).hostname}`,
        weight: -2,
        flag: "yellow",
      },
    ];
  }
  return [
    { url: evidence.finalUrl, kind: "home", note: "Home page loads", weight: 1, flag: "green" },
  ];
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
      flag: "yellow",
    });
  }
  if (evidence.docs !== null) {
    signals.push({
      url: evidence.docs,
      kind: "docs",
      note: "Help centre or docs found",
      weight: 1,
      flag: "green",
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
      flag: stale ? "yellow" : "green",
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
      flag: young ? "yellow" : "green",
      young,
    });
  }
  return signals;
}

/**
 * The home page tells of a rename or a new owner: one doubt, whatever the number
 * of phrases. Alone it doesn't make a product Yellow (Planview Vantage, "formerly
 * Sciforma", is Green); with a yellow news hit it does.
 */
function churnSignals(evidence: Evidence): Signal[] {
  if (evidence.churn.length === 0) return [];
  return [
    {
      url: evidence.finalUrl ?? evidence.url,
      kind: "churn",
      note: `Home page tells of a rename or new owner: ${evidence.churn.map((p) => `"${p}"`).join("; ")}`,
      weight: -0.5,
      flag: "yellow",
    },
  ];
}

/** The vendor says the product ends: a reason not to buy, whatever else looks alive. */
function endSignals(evidence: Evidence): Signal[] {
  const notice = evidence.endNotices[0];
  if (notice === undefined) return [];
  return [
    {
      url: evidence.finalUrl ?? evidence.url,
      kind: "end-notice",
      note: `The vendor says the product ends: "${notice}"`,
      weight: -1,
      flag: "red",
    },
  ];
}

/**
 * Each lookup that didn't answer (archive, search): no weight either way, but the
 * verdict rests on less than it seems. A home page that fails is not a gap: that
 * failure is the evidence, and homeSignals already counts it.
 */
function gapSignals(evidence: Evidence): Signal[] {
  const lookups = evidence.errors.filter((error) => !error.startsWith("home:"));
  return lookups.map((error): Signal => ({
    url: evidence.url,
    kind: "gap",
    note: `Not checked: ${error}`,
    weight: 0,
    flag: "yellow",
  }));
}

/** Every observation the rules make about one product. */
export function collectSignals(evidence: Evidence, now: Date): Signal[] {
  return [
    ...homeSignals(evidence),
    ...linkSignals(evidence),
    ...waybackSignals(evidence, now),
    ...churnSignals(evidence),
    ...endSignals(evidence),
    ...riskSignals(evidence, now),
    ...gapSignals(evidence),
  ];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Adds the signals up. Alive and dead weight are compared; the share of the
 * winning side is the confidence. A young site that looks alive is `doubt`,
 * and a weak lead is `unsure` rather than a guess. A failed lookup caps the
 * confidence, and "alive" resting on fewer than MIN_SIGNALS observations is
 * `unsure`: a home page that loads is not enough to trust a product. A live
 * product with MIN_YELLOW_RISKS or more recent yellow search hits and churn
 * signals, together, is `doubt`.
 */
export function judge(evidence: Evidence, now: Date): ProductVerdict {
  const signals = collectSignals(evidence, now);
  const alive = signals.reduce((sum, s) => sum + Math.max(s.weight, 0), 0);
  const dead = signals.reduce((sum, s) => sum + Math.max(-s.weight, 0), 0);
  const links = signals.map(({ url, kind, note, flag }) => ({ url, kind, note, flag }));
  const total = alive + dead;
  // Defensive: homeSignals always adds a signal, so total is never 0 today.
  if (total === 0) {
    return { product: evidence.url, verdict: "unsure", confidence: 0, evidence: links };
  }
  const hasGap = signals.some((s) => s.kind === "gap");
  const share = round2(Math.max(alive, dead) / total);
  const confidence = hasGap ? Math.min(share, GAP_MAX_CONFIDENCE) : share;
  const lean = alive >= dead ? "trust" : "dead";
  const yellowRisks = signals.filter(
    (s) => (s.kind === "search" || s.kind === "churn") && s.flag === "yellow" && s.old !== true,
  ).length;
  const doubtful = signals.some((s) => s.young === true) || yellowRisks >= MIN_YELLOW_RISKS;
  const observed = signals.filter((s) => s.kind !== "gap").length;
  const thin = lean === "trust" && observed < MIN_SIGNALS;
  const verdict =
    confidence < MIN_CONFIDENCE || thin ? "unsure" : lean === "trust" && doubtful ? "doubt" : lean;
  return { product: evidence.url, verdict, confidence, evidence: links };
}
