import { describe, expect, it } from "vitest";
import type { Task } from "@app/shared";
import { addTask, clearDone, createTask, removeTask, summarize, toggleTask } from "./tasks.ts";

const now = new Date("2026-01-01T12:00:00.000Z");

function task(id: string, done = false): Task {
  return { id, title: `Task ${id}`, done, createdAt: now.toISOString() };
}

describe("createTask", () => {
  it("creates an open task with a trimmed title", () => {
    const result = createTask({ title: "  Buy milk  ", id: "1", now });
    expect(result).toEqual({
      ok: true,
      task: { id: "1", title: "Buy milk", done: false, createdAt: "2026-01-01T12:00:00.000Z" },
    });
  });

  it("rejects an empty title", () => {
    expect(createTask({ title: "   ", id: "1", now }).ok).toBe(false);
  });

  it("rejects a title that is too long", () => {
    expect(createTask({ title: "x".repeat(201), id: "1", now }).ok).toBe(false);
  });
});

describe("task list changes", () => {
  it("adds new tasks at the top", () => {
    expect(addTask([task("a")], task("b")).map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("toggles only the matching task", () => {
    const result = toggleTask([task("a"), task("b")], "b");
    expect(result.map((t) => t.done)).toEqual([false, true]);
  });

  it("removes a task", () => {
    expect(removeTask([task("a"), task("b")], "a").map((t) => t.id)).toEqual(["b"]);
  });

  it("clears finished tasks", () => {
    expect(clearDone([task("a", true), task("b")]).map((t) => t.id)).toEqual(["b"]);
  });

  it("never changes the list it was given", () => {
    const original = [task("a")];
    toggleTask(original, "a");
    expect(original[0]?.done).toBe(false);
  });
});

describe("summarize", () => {
  it("counts open and finished tasks", () => {
    expect(summarize([task("a", true), task("b"), task("c")])).toEqual({
      total: 3,
      done: 1,
      open: 2,
    });
  });
});
