// The Claude judge: a prompt built from Stackgini's reviewers' checklist, and the rules that
// read its reply into a verdict line. Pure functions: the agent runs `claude -p` (decision 7).
import {
  JudgeReplySchema,
  type JudgeReply,
  type Rating,
  type Verdict,
  type VerdictLine,
} from "@app/shared";

/**
 * What Stackgini's reviewers look at, taken from the flags in their 40 samples. Generic
 * questions only: no sample product, vendor or answer is named here.
 */
export const REVIEW_CHECKLIST = [
  "Real customers: named customers, case studies, a user community, or believable reach.",
  "Traction claims: big user or revenue numbers that cannot be checked or contradict each other (red when clearly inflated).",
  "Legal entity: a company name, address or legal notice; who really stands behind the product.",
  "Way to buy or try: pricing, a store, a trial or a demo that works.",
  "Maintained: current dates, recent releases or news; a site that looks abandoned or decades old is a doubt.",
  "Clear product: what it is and how it fits the vendor's portfolio; a confusing naming or bundle mess is a doubt.",
  "Ownership and name history: renames, acquisitions, carve-outs, private-equity owners, pivots; repeated churn is a doubt.",
  "Trust and security: a trust centre or security page; breaches and how openly they were disclosed (a doubt, rarely red).",
  "Ending: the product is shut down, end of life, or announced to stop (red).",
  "Legal and regulatory: a regulator's fine, a privacy violation, sanctions or a business in a sanctioned country (red); lawsuits (a doubt).",
] as const;

/** The product's name without the description in brackets: the samples' brackets hold reviewer hints. */
export function shortName(name: string): string {
  return name.split(" (")[0]!.trim() || name;
}

/** The prompt for one product. `line` is the rule-based verdict: its links are hints, not answers. */
export function judgePrompt(name: string, url: string, line: VerdictLine): string {
  const hints = line.evidence.map((e) => `- [${e.flag}] ${e.note} (${e.url})`);
  return [
    `You are an experienced software buyer. Judge "${shortName(name)}" (${url}): is it real, alive,`,
    "and would you trust the company with a purchase? Do not be fooled by polish, and do not",
    "dismiss a solid product for an ugly site. Check the facts.",
    "",
    "Rate it like the reviewers do:",
    "- green: real and alive, nothing serious against it. Small doubts are fine: one past",
    "  acquisition, or an old incident at a parent company, does not make a product yellow.",
    "- yellow: real, but with doubts a buyer must weigh: repeated renames or owners, a",
    "  confusing product, an abandoned-looking site, a breach handled poorly.",
    "- red: a reason not to buy. It is ending or dead; a regulator or court found it acted",
    "  unlawfully (even without a fine); it handles sensitive data (faces, health, finance)",
    "  with legal trouble; or it sells to regulated or security-critical buyers while",
    "  basic governance is missing (no legal entity, no real privacy or security documents)",
    "  or its own claims contradict each other. When in doubt between yellow and red, say red",
    "  if a careful buyer would walk away.",
    "",
    "Checklist:",
    ...REVIEW_CHECKLIST.map((item, i) => `${i + 1}. ${item}`),
    "",
    "Evidence our tools already collected (may be incomplete or wrong):",
    ...(hints.length ? hints : ["- none"]),
    "",
    "Use web search, and open at most 5 pages of the vendor's own site. Every reason needs a",
    "link a human can open. Answer with only this JSON, no prose:",
    '{"rating": "green|yellow|red", "confidence": 0.0-1.0,',
    ' "reasons": [{"flag": "green|yellow|red", "note": "one checkable sentence", "url": "https://..."}]}',
    "Give 3 to 6 reasons. A red rating needs at least one red reason.",
  ].join("\n");
}

/** The JSON object in Claude's reply, checked against the schema. */
export function parseJudgeReply(
  reply: string,
): { ok: true; reply: JudgeReply } | { ok: false; error: string } {
  const start = reply.indexOf("{");
  const end = reply.lastIndexOf("}");
  if (start === -1 || end < start) return { ok: false, error: "judge: no JSON in the reply" };
  let raw: unknown;
  try {
    raw = JSON.parse(reply.slice(start, end + 1));
  } catch {
    return { ok: false, error: "judge: the reply is not valid JSON" };
  }
  const parsed = JudgeReplySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "judge: the reply does not fit the schema" };
  if (parsed.data.rating === "red" && !parsed.data.reasons.some((r) => r.flag === "red")) {
    return { ok: false, error: "judge: a red rating without a red reason" };
  }
  return { ok: true, reply: parsed.data };
}

const VERDICT_OF: Readonly<Record<Rating, Verdict>> = {
  green: "trust",
  yellow: "doubt",
  // Red is a reason not to buy, not always a dead product: the red reason makes it Red.
  red: "doubt",
};

/**
 * The judge has the last word. Its reasons come first; the rules' evidence stays as links,
 * except their red flags, which the judge saw and either took up or overruled.
 */
export function judgedLine(line: VerdictLine, reply: JudgeReply): VerdictLine {
  const reasons = reply.reasons.map((r) => ({ ...r, kind: "judge" as const }));
  const kept = line.evidence
    .filter((e) => e.kind !== "gap")
    .map((e) => (e.flag === "red" ? { ...e, flag: "yellow" as const } : e));
  // A green call keeps no yellow from the rules that the judge did not raise itself.
  const rest = reply.rating === "green" ? kept.filter((e) => e.flag === "green") : kept;
  return {
    ...line,
    verdict: VERDICT_OF[reply.rating],
    confidence: reply.confidence,
    evidence: [...reasons, ...rest],
  };
}
