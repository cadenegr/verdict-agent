// Rules that read raw web material (HTML, archive rows, statuses) and turn it into evidence.
// Pure: the network lives in apps/agent, these functions only see strings and numbers.
import {
  DEAD_LINK_EXAMPLES,
  RISK_TOPICS,
  type DeadLink,
  type Evidence,
  type SearchHit,
} from "@app/shared";

function textOf(html: string): string {
  return html
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ");
}

/** The latest year written next to a copyright sign or the word "copyright", or null. */
export function findCopyrightYear(html: string): number | null {
  const text = textOf(html);
  const pattern =
    /(?:©|&copy;|&#169;|\(c\)|copyright)[^\d]{0,40}((?:19|20)\d{2})(?:\s*[-–—]\s*((?:19|20)\d{2}))?/gi;
  let latest: number | null = null;
  for (const match of text.matchAll(pattern)) {
    for (const year of [match[1], match[2]]) {
      if (year === undefined) continue;
      const value = Number(year);
      if (latest === null || value > latest) latest = value;
    }
  }
  return latest;
}

/**
 * Words that tell of a rename or a new owner. "Legacy" alone is left out: vendors
 * use it for the systems they replace ("modernise your legacy apps").
 */
const CHURN_PATTERNS: readonly RegExp[] = [
  /\bformerly\b/i,
  /\bpreviously (?:known as|called)\b/i,
  /\bnow (?:part of|called|known as)\b/i,
  /\b(?:acquired|replaced|superseded) by\b/i,
  /\brenamed\b/i,
  /\brebrand(?:ed|ing)?\b/i,
  /\bis now [A-Z]/,
  /\ban? [A-Z][\w&.-]* company\b/,
];

/** At most this many snippets per page, for churn phrases and end notices alike. */
const MAX_SNIPPETS = 3;

function metaContent(html: string, name: string): string {
  const pattern = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  return pattern.exec(html)?.[1] ?? "";
}

/**
 * Short snippets from the title, the meta description and the page text that say
 * the product was renamed or changed owner ("Snow Atlas, formerly Snow Software").
 * One snippet per pattern, the title and description first.
 */
export function findChurnPhrases(html: string): string[] {
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1] ?? "";
  const sources = [
    title,
    metaContent(html, "description"),
    metaContent(html, "og:description"),
    textOf(html),
  ].map((text) => text.replace(/\s+/g, " ").trim());
  return snippets(sources, CHURN_PATTERNS);
}

/** One snippet per pattern, from the first source that has it, at most MAX_SNIPPETS. */
function snippets(sources: readonly string[], patterns: readonly RegExp[]): string[] {
  const phrases: string[] = [];
  for (const pattern of patterns) {
    if (phrases.length >= MAX_SNIPPETS) break;
    for (const text of sources) {
      const match = pattern.exec(text);
      if (!match) continue;
      const start = Math.max(0, match.index - 40);
      const end = Math.min(text.length, match.index + match[0].length + 40);
      phrases.push(text.slice(start, end).trim());
      break;
    }
  }
  return phrases;
}

/**
 * The vendor's own notice that the product ends: "end of life", "no longer
 * supported", "wird nach 2026 eingestellt". Link texts are left out: a menu
 * entry "End-of-life policy" is no notice. A bare "discontinued" is left out too:
 * shops list discontinued items.
 */
const END_PATTERNS: readonly RegExp[] = [
  /\bend[- ]of[- ](?:life|sale|support)\b/i,
  /\b(?:is|has been|will be|are|have been) (?:being )?(?:discontinued|retired|sunset|shut down)\b/i,
  /\bno longer (?:supported|developed|maintained|available|sold|offered)\b/i,
  /\b(?:wird|werden)\b[^.!?]{0,40}\beingestellt\b/i,
  /\bnicht mehr (?:unterstützt|weiterentwickelt|gepflegt|angeboten)\b/i,
];

/** Snippets of the page's own end-of-life notice, at most MAX_SNIPPETS. */
export function findEndNotices(html: string): string[] {
  const text = textOf(html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, " "));
  return snippets([text], END_PATTERNS);
}

/** The product's name: og:site_name, else the first part of <title>, else the host. */
export function findSiteName(html: string, url: string): string {
  const og = /<meta[^>]+property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i.exec(html);
  if (og?.[1]) return og[1].trim();
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim();
  const first = title?.split(/\s[|–—:-]\s/)[0]?.trim();
  if (first) return first;
  return new URL(url).hostname.replace(/^www\./, "").split(".")[0] ?? url;
}

/** Every http(s) link in the page, resolved against the page URL, without fragments, deduplicated. */
export function extractLinks(html: string, pageUrl: string): string[] {
  const seen = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)) {
    const raw = match[1]?.replace(/&amp;/g, "&");
    if (!raw) continue;
    let resolved: URL;
    try {
      resolved = new URL(raw, pageUrl);
    } catch {
      continue;
    }
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") continue;
    resolved.hash = "";
    seen.add(resolved.href);
  }
  return [...seen];
}

/** Two-part public suffixes, so foo.co.uk and bar.co.uk are different sites. */
const TWO_PART_SUFFIX = /\.(co|com|org|net|gov|ac|edu|ne|or)\.[a-z]{2}$/i;

function siteOf(host: string): string {
  const parts = host.replace(/^www\./, "").split(".");
  return parts.slice(TWO_PART_SUFFIX.test(host) ? -3 : -2).join(".");
}

/** True when the link belongs to the same site as the page (subdomains count). */
export function isSameSite(link: string, pageUrl: string): boolean {
  return siteOf(new URL(link).hostname) === siteOf(new URL(pageUrl).hostname);
}

const DOCS_HOST = /^(docs|help|support|developers?|kb|learn|guide|manual)\./i;
const DOCS_PATH =
  /\/(docs|documentation|help|help-center|support|knowledge-?base|guides?|manual)(\/|$)/i;

/** The most likely help centre or documentation link among the page's links, or null. */
export function pickDocsLink(links: readonly string[], pageUrl: string): string | null {
  const ownLinks = links.filter((link) => isSameSite(link, pageUrl));
  const byHost = ownLinks.find((link) => DOCS_HOST.test(new URL(link).hostname));
  if (byHost) return byHost;
  return ownLinks.find((link) => DOCS_PATH.test(new URL(link).pathname)) ?? null;
}

/** Same-site links to check for dead ends, one per path, at most `budget`. */
export function pickLinksToCheck(
  links: readonly string[],
  pageUrl: string,
  budget: number,
): string[] {
  const home = new URL(pageUrl);
  const paths = new Set<string>([home.hostname + home.pathname]);
  const picked: string[] = [];
  for (const link of links) {
    if (picked.length >= budget) break;
    if (!isSameSite(link, pageUrl)) continue;
    const url = new URL(link);
    const key = url.hostname + url.pathname;
    if (paths.has(key)) continue;
    paths.add(key);
    picked.push(link);
  }
  return picked;
}

/**
 * A link is dead when it fails or answers 404/410/5xx.
 * 401, 403, 405 and 429 mean "not for robots", which says nothing about the product.
 */
export function isDeadStatus(status: number | null): boolean {
  if (status === null) return true;
  if ([401, 403, 405, 429].includes(status)) return false;
  return status >= 400;
}

/** Snapshot link for one row of the Wayback CDX API ([timestamp, original]); null for the header or bad rows. */
export function waybackLink(row: readonly string[] | undefined): string | null {
  const [timestamp, original] = row ?? [];
  if (!timestamp || !original || !/^\d{14}$/.test(timestamp)) return null;
  return `https://web.archive.org/web/${timestamp}/${original}`;
}

export function riskQueries(name: string): string[] {
  // The name comes from the vendor's own page: keep it short and plain before it goes into a query.
  const clean = name
    .replace(/["\r\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return RISK_TOPICS.map((topic) => `"${clean}" ${topic}`);
}

export interface EvidenceParts {
  url: string;
  finalUrl: string | null;
  fetchedAt: Date;
  copyrightYear: number | null;
  churn: readonly string[];
  endNotices: readonly string[];
  checked: readonly DeadLink[];
  docs: string | null;
  wayback: { first: string | null; last: string | null };
  search: readonly SearchHit[];
  errors: readonly string[];
  durationMs: number;
}

/** One evidence record, with every openable link gathered in `links`. */
export function assembleEvidence(parts: EvidenceParts): Evidence {
  const dead = parts.checked.filter((link) => isDeadStatus(link.status));
  const examples = dead.slice(0, DEAD_LINK_EXAMPLES);
  const links = [
    parts.finalUrl ?? parts.url,
    parts.docs,
    parts.wayback.first,
    parts.wayback.last,
    ...examples.map((link) => link.url),
    ...parts.search.map((hit) => hit.url),
  ].filter((link): link is string => link !== null);
  return {
    url: parts.url,
    finalUrl: parts.finalUrl,
    fetchedAt: parts.fetchedAt.toISOString(),
    copyrightYear: parts.copyrightYear,
    churn: [...parts.churn],
    endNotices: [...parts.endNotices],
    deadLinks: { checked: parts.checked.length, dead: dead.length, examples },
    docs: parts.docs,
    wayback: parts.wayback,
    search: [...parts.search],
    links: [...new Set(links)],
    errors: [...parts.errors],
    durationMs: Math.round(parts.durationMs),
  };
}
