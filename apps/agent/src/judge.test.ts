import { describe, expect, it } from "vitest";
import type { VerdictLine } from "@app/shared";
import { claudeJudge } from "./judge.ts";

const line: VerdictLine = {
  name: "Acme",
  product: "https://acme.example/",
  verdict: "trust",
  confidence: 0.9,
  checkedAt: "2026-11-27T12:00:00.000Z",
  evidence: [
    { url: "https://acme.example/", kind: "home", note: "Home page loads", flag: "green" },
  ],
};

describe("claudeJudge", () => {
  it("takes the judge's rating when the reply fits", async () => {
    const reply =
      '{"rating":"yellow","confidence":0.7,"reasons":[{"flag":"yellow","note":"Renamed twice","url":"https://news.example/"}]}';
    const result = await claudeJudge("haiku", async () => reply).review(line);
    expect(result.error).toBeNull();
    expect(result.line.verdict).toBe("doubt");
  });

  it("keeps the rules' line when Claude fails or answers badly", async () => {
    const failed = await claudeJudge("haiku", async () => {
      throw new Error("timeout");
    }).review(line);
    expect(failed).toEqual({ line, error: "judge: timeout" });
    const bad = await claudeJudge("haiku", async () => "sorry").review(line);
    expect(bad.line).toBe(line);
    expect(bad.error).toBe("judge: no JSON in the reply");
  });
});
