import { describe, expect, it } from "vitest";
import type { VerdictLine } from "@app/shared";
import { REVIEW_CHECKLIST, judgePrompt, judgedLine, parseJudgeReply, shortName } from "./judge.ts";
import { ratingOf } from "./stackgini.ts";

const line: VerdictLine = {
  name: "Acme Suite (formerly Foo; owned by a fund)",
  product: "https://acme.example/",
  verdict: "dead",
  confidence: 0.9,
  checkedAt: "2026-11-27T12:00:00.000Z",
  evidence: [
    { url: "https://acme.example/", kind: "home", note: "Home page loads", flag: "green" },
    { url: "https://news.example/a", kind: "search", note: '"shut down": x', flag: "red" },
    {
      url: "https://web.archive.org/",
      kind: "gap",
      note: "Archive did not answer",
      flag: "yellow",
    },
    { url: "https://news.example/b", kind: "search", note: '"renamed": y', flag: "yellow" },
  ],
};

const reply = (rating: string, flags: string[]) =>
  JSON.stringify({
    rating,
    confidence: 0.8,
    reasons: flags.map((flag) => ({ flag, note: `a ${flag} reason`, url: "https://src.example/" })),
  });

describe("shortName", () => {
  it("drops the description in brackets, where the samples hold hints", () => {
    expect(shortName("Acme Suite (formerly Foo)")).toBe("Acme Suite");
    expect(shortName("Acme")).toBe("Acme");
  });
});

describe("judgePrompt", () => {
  it("names every checklist item and the collected links, but not the bracket hints", () => {
    const prompt = judgePrompt(line.name, line.product, line);
    for (const item of REVIEW_CHECKLIST) expect(prompt).toContain(item);
    expect(prompt).toContain("https://news.example/a");
    expect(prompt).not.toContain("formerly Foo");
  });
});

describe("parseJudgeReply", () => {
  it("reads the JSON object around prose", () => {
    const result = parseJudgeReply(`Here it is:\n${reply("yellow", ["yellow", "green"])}\nDone.`);
    expect(result).toMatchObject({ ok: true, reply: { rating: "yellow", confidence: 0.8 } });
  });

  it("refuses no JSON, bad JSON, a wrong shape and a red without a red reason", () => {
    expect(parseJudgeReply("no idea").ok).toBe(false);
    expect(parseJudgeReply("{not json}").ok).toBe(false);
    expect(parseJudgeReply('{"rating": "blue"}').ok).toBe(false);
    expect(parseJudgeReply(reply("red", ["yellow"])).ok).toBe(false);
  });
});

describe("judgedLine", () => {
  const judged = (rating: string, flags: string[]) => {
    const parsed = parseJudgeReply(reply(rating, flags));
    if (!parsed.ok) throw new Error(parsed.error);
    return judgedLine(line, parsed.reply);
  };

  it("lets a green call overrule the rules' red and yellow flags", () => {
    const result = judged("green", ["green", "yellow"]);
    expect(ratingOf(result)).toBe("green");
    expect(result.evidence.filter((e) => e.kind === "search")).toEqual([]);
    expect(result.evidence[0]).toMatchObject({ kind: "judge", flag: "green" });
  });

  it("makes a yellow call Yellow, keeping the rules' links as doubts", () => {
    const result = judged("yellow", ["yellow"]);
    expect(ratingOf(result)).toBe("yellow");
    expect(result.evidence.some((e) => e.url === "https://news.example/a")).toBe(true);
  });

  it("makes a red call Red through the judge's own red reason", () => {
    const result = judged("red", ["red", "green"]);
    expect(ratingOf(result)).toBe("red");
    expect(result.evidence.filter((e) => e.flag === "red")).toEqual([
      expect.objectContaining({ kind: "judge" }),
    ]);
  });

  it("drops gaps and takes the judge's confidence", () => {
    const result = judged("yellow", ["yellow"]);
    expect(result.evidence.some((e) => e.kind === "gap")).toBe(false);
    expect(result.confidence).toBe(0.8);
  });
});
