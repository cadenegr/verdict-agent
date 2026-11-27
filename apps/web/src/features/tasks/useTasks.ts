import { useEffect, useState } from "react";
import { addTask, clearDone, createTask, removeTask, summarize, toggleTask } from "@app/core";
import { loadTasks, saveTasks } from "./taskStorage.ts";

function newId(): string {
  // randomUUID only exists on https and localhost; fall back elsewhere (e.g. a phone on the LAN).
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Connects the UI to the logic in @app/core and to storage. No rules live here.
export function useTasks() {
  const [tasks, setTasks] = useState(loadTasks);

  useEffect(() => saveTasks(tasks), [tasks]);

  function add(title: string): string | null {
    const result = createTask({ title, id: newId(), now: new Date() });
    if (!result.ok) return result.error;
    setTasks((current) => addTask(current, result.task));
    return null;
  }

  return {
    tasks,
    summary: summarize(tasks),
    add,
    toggle: (id: string) => setTasks((current) => toggleTask(current, id)),
    remove: (id: string) => setTasks((current) => removeTask(current, id)),
    clearDone: () => setTasks(clearDone),
  };
}
