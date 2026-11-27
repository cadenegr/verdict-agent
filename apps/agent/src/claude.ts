// Runs Claude Code headless (`claude -p`). Uses the owner's Claude budget: every caller is opt-in.
import { execFile } from "node:child_process";

export type Runner = (args: string[], timeoutMs: number) => Promise<string>;

export const runClaude: Runner = (args, timeoutMs) =>
  new Promise((resolve, reject) => {
    execFile("claude", args, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 }, (error, stdout) =>
      error ? reject(error) : resolve(stdout),
    );
  });
