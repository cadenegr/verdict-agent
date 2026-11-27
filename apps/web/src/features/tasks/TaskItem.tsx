import { Trash2 } from "lucide-react";
import type { Task } from "@app/shared";
import { Button, Checkbox, ListItem } from "../../components/ui/index.ts";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TaskItem({ task, onToggle, onRemove }: TaskItemProps) {
  return (
    <ListItem>
      <Checkbox
        checked={task.done}
        onChange={() => onToggle(task.id)}
        label={<span className={task.done ? "text-ink-muted line-through" : ""}>{task.title}</span>}
      />
      {/* Icon only on phones, to leave room for the title; the word shows from sm up. */}
      <Button
        variant="ghost"
        onClick={() => onRemove(task.id)}
        aria-label={`Delete "${task.title}"`}
        className="px-3"
      >
        <Trash2 aria-hidden size={26} strokeWidth={2.25} />
        <span className="hidden sm:inline">Delete</span>
      </Button>
    </ListItem>
  );
}
