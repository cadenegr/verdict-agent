// Risk news from web search: which hits count against a product, and how much.
// Pure functions: the clock comes in as `now`.
import {
  RISK_HIT_MAX_AGE_YEARS,
  RISK_TOPICS,
  type Evidence,
  type Rating,
  type RiskTopic,
  type SearchHit,
} from "@app/shared";
import type { Signal } from "./verdict.ts";

interface RiskRule {
  weight: number;
  flag: Rating;
  /** The hit's title must contain one of these: search engines return near misses. */
  words: readonly string[];
}

/**
 * How much each risk topic weighs against a product, the flag it raises, and the
 * words that show a title is really about it. Red only for what ends a purchase:
 * a shutdown, a regulator's fine, a privacy violation. Breaches and the rest are
 * doubts: every large vendor has one (decision 6). Tuned on the odd rows of the
 * Stackgini samples only.
 */
const RISK_RULES: Readonly<Record<RiskTopic, RiskRule>> = {
  "shut down": { weight: -1, flag: "red", words: ["shut", "shutter", "closing down"] },
  "data breach": {
    weight: -0.5,
    flag: "yellow",
    words: ["breach", "leak", "hack", "exposed", "stolen"],
  },
  "fined by regulator": {
    weight: -1,
    flag: "red",
    words: ["fine", "penalt", "ftc", "settle"],
  },
  // "privacy" alone finds the vendor's own privacy policy, "closes" its year-end news
  // ("Closes 2025 after ..."), and "regulator" a lawsuit, not a fine (Tavily hits).
  "privacy violation": {
    weight: -1,
    flag: "red",
    words: ["violat", "gdpr", "surveillance", "unlawful"],
  },
  lawsuit: {
    weight: -0.5,
    flag: "yellow",
    words: ["lawsuit", "sued", "sues", "suit", "court", "class action"],
  },
  acquired: {
    weight: -0.5,
    flag: "yellow",
    words: ["acquire", "acquisition", "buys", "bought", "takeover", "to buy"],
  },
  // "equity" or "investor" alone also finds use-case pages and company profiles.
  "private equity": {
    weight: -0.5,
    flag: "yellow",
    words: [
      "private equity",
      "buyout",
      "kkr",
      "vista",
      "thoma bravo",
      "clearlake",
      "silver lake",
      "francisco partners",
      "permira",
    ],
  },
  "CEO steps down": { weight: -0.5, flag: "yellow", words: ["ceo"] },
  discontinued: {
    weight: -1,
    flag: "yellow",
    words: ["discontinu", "end of life", "end-of-life", "deprecat", "retire", "sunset"],
  },
  renamed: {
    weight: -0.5,
    flag: "yellow",
    words: ["rename", "rebrand", "new name", "now called", "formerly"],
  },
};

/** A title about what may happen ("EU warns Microsoft it could be fined"). */
const SPECULATIVE = /\b(?:could|might|would|warns?|threatens?|faces?|probe[sd]?)\b/i;

/**
 * The product name in a query: `"<name>" <topic>`. The search model sometimes echoes
 * the query with one quote or none, so the quotes are dropped and the topic cut off.
 */
function queriedName(query: string): string {
  const bare = query.replace(/"/g, "").trim();
  const topic = RISK_TOPICS.find((t) => bare.toLowerCase().endsWith(` ${t.toLowerCase()}`));
  return (topic ? bare.slice(0, -topic.length - 1) : bare).trim();
}

/**
 * A hit counts only when its title names the product: every large vendor has
 * some lawsuit, and a search returns it whether or not it is about this product.
 * The whole name matches, or its first word when that word is long enough to mean something.
 */
export function namesProduct(hit: SearchHit): boolean {
  const name = queriedName(hit.query).toLowerCase();
  const title = hit.title.toLowerCase();
  if (name === "") return false;
  if (hasWord(title, name)) return true;
  const first = name.split(/[\s/:–-]+/)[0] ?? "";
  return first.length >= 4 && hasWord(title, first);
}

/** `words` appears in `text` as whole words: "R" is not found in "Rust". */
function hasWord(text: string, words: string): boolean {
  const escaped = words.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "u").test(text);
}

/**
 * The title is about the topic, not only near it ("Redmine stops abruptly" is no shutdown).
 * A title that asks ("Is X violating GDPR?") is a question, not news.
 */
function aboutTopic(hit: SearchHit, rule: RiskRule): boolean {
  const title = hit.title.toLowerCase().trim();
  if (title.endsWith("?")) return false;
  return rule.words.some((word) => title.includes(word));
}

/** One signal per risk topic, from the first hit that names the product and the topic. */
export function riskSignals(evidence: Evidence, now: Date): Signal[] {
  const signals: Signal[] = [];
  for (const topic of RISK_TOPICS) {
    const rule = RISK_RULES[topic];
    // The query is `"<name>" <topic>`: match the end, so a product named "Acquired" is not hit.
    const ending = ` ${topic.toLowerCase()}`;
    const hit = evidence.search.find(
      (h) => h.query.toLowerCase().endsWith(ending) && namesProduct(h) && aboutTopic(h, rule),
    );
    if (!hit) continue;
    const old = hit.year !== null && now.getUTCFullYear() - hit.year > RISK_HIT_MAX_AGE_YEARS;
    // "could be fined" is a warning: a doubt, not yet a reason not to buy.
    const maybe = rule.flag === "red" && SPECULATIVE.test(hit.title);
    const when = hit.year === null ? "" : ` (${hit.year})`;
    signals.push({
      url: hit.url,
      kind: "search",
      note: `"${topic}": ${hit.title}${when}`,
      // An old story still says something, but not enough for a red flag.
      weight: old || maybe ? rule.weight / 2 : rule.weight,
      flag: old || maybe ? "yellow" : rule.flag,
      old,
    });
  }
  return signals;
}
