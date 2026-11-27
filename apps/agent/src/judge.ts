// The Claude judge (decision 7): Claude reads the product against the reviewers' checklist
// and has the last word on the rating. Opt in with JUDGE=claude: it uses the owner's budget.
import { judgePrompt, judgedLine, parseJudgeReply } from "@app/core";
import type { VerdictLine } from "@app/shared";
import { runClaude, type Runner } from "./claude.ts";

/** Web search and reading pages take time: one product, a few searches, up to 5 pages. */
const TIMEOUT_MS = 300_000;

export interface Judge {
  /** The line as the judge sees it, or the rules' line with the reason the judge failed. */
  review(line: VerdictLine): Promise<{ line: VerdictLine; error: string | null }>;
}

export function claudeJudge(model = "sonnet", run: Runner = runClaude): Judge {
  return {
    async review(line) {
      const args = [
        "-p",
        judgePrompt(line.name, line.product, line),
        "--model",
        model,
        "--allowedTools",
        "WebSearch,WebFetch",
      ];
      let reply: string;
      try {
        reply = await run(args, TIMEOUT_MS);
      } catch (error) {
        return { line, error: `judge: ${error instanceof Error ? error.message : String(error)}` };
      }
      const parsed = parseJudgeReply(reply);
      return parsed.ok
        ? { line: judgedLine(line, parsed.reply), error: null }
        : { line, error: parsed.error };
    },
  };
}

/** The judge named by JUDGE (none | claude), with JUDGE_MODEL (default sonnet). */
export function judgeFromEnv(env: NodeJS.ProcessEnv): Judge | null {
  const name = env.JUDGE ?? "none";
  if (name === "claude") return claudeJudge(env.JUDGE_MODEL || "sonnet");
  if (name === "none") return null;
  throw new Error(`Unknown JUDGE "${name}": use none or claude.`);
}
