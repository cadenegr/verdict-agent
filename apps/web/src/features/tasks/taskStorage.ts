import { TaskListSchema, type Task } from "@app/shared";

// Storage adapter: the only file that knows tasks are kept in localStorage.
// Swapping to an API later means changing this file, not the UI or the logic.

const STORAGE_KEY = "app.tasks";

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = TaskListSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: readonly Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // Storage can be full or blocked (private mode). The app keeps working in memory.
  }
}
