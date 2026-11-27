import { describe, expect, it } from "vitest";
import { mapWithLimit } from "./pool.ts";

describe("mapWithLimit", () => {
  it("keeps the input order", async () => {
    const out = await mapWithLimit([30, 10, 20], 3, async (ms) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      return ms * 2;
    });
    expect(out).toEqual([60, 20, 40]);
  });

  it("never runs more than the limit at once", async () => {
    let running = 0;
    let most = 0;
    await mapWithLimit([1, 2, 3, 4, 5, 6], 2, async () => {
      running += 1;
      most = Math.max(most, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
    });
    expect(most).toBe(2);
  });

  it("handles an empty list", async () => {
    expect(await mapWithLimit([], 4, async () => 1)).toEqual([]);
  });
});
