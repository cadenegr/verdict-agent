import { TaskSchema, type Task } from "@app/shared";

export interface NewTaskInput {
  title: string;
  /** Passed in rather than generated here, so the logic stays predictable and testable. */
  id: string;
  now: Date;
}

export type CreateTaskResult = { ok: true; task: Task } | { ok: false; error: string };

export function createTask({ title, id, now }: NewTaskInput): CreateTaskResult {
  const parsed = TaskSchema.safeParse({
    id,
    title,
    done: false,
    createdAt: now.toISOString(),
  });
  if (!parsed.success) {
    return { ok: false, error: "A task needs a title of 1 to 200 characters." };
  }
  return { ok: true, task: parsed.data };
}

export function addTask(tasks: readonly Task[], task: Task): Task[] {
  return [task, ...tasks];
}

export function toggleTask(tasks: readonly Task[], id: string): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
}

export function removeTask(tasks: readonly Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id);
}

export function clearDone(tasks: readonly Task[]): Task[] {
  return tasks.filter((task) => !task.done);
}

export interface TaskSummary {
  total: number;
  done: number;
  open: number;
}

export function summarize(tasks: readonly Task[]): TaskSummary {
  const done = tasks.filter((task) => task.done).length;
  return { total: tasks.length, done, open: tasks.length - done };
}
