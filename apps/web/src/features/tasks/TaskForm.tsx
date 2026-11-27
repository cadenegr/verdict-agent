import { useState, type FormEvent } from "react";
import { TITLE_MAX_LENGTH } from "@app/shared";
import { Button, TextField } from "../../components/ui/index.ts";

interface TaskFormProps {
  /** Returns an error message, or null when the task was added. */
  onAdd: (title: string) => string | null;
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const problem = onAdd(title);
    setError(problem);
    if (!problem) setTitle("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <TextField
        label="New task"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={TITLE_MAX_LENGTH}
        placeholder="What needs doing?"
        error={error}
      />
      <Button type="submit" className="sm:self-start">
        Add
      </Button>
    </form>
  );
}
