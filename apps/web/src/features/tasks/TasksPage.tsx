import { Button, Card, List, Page } from "../../components/ui/index.ts";
import { TaskForm } from "./TaskForm.tsx";
import { TaskItem } from "./TaskItem.tsx";
import { useTasks } from "./useTasks.ts";

// Example feature showing the layers: UI here, rules in @app/core,
// data shapes in @app/shared, storage in taskStorage.ts. Replace it with your own.
export function TasksPage() {
  const { tasks, summary, add, toggle, remove, clearDone } = useTasks();

  return (
    <Page title="Tasks">
      <TaskForm onAdd={add} />

      {tasks.length === 0 ? (
        <Card>
          <p className="py-4 text-center text-lg text-ink-muted">Nothing to do yet.</p>
        </Card>
      ) : (
        <List label="Tasks">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={toggle} onRemove={remove} />
          ))}
        </List>
      )}

      <div className="flex min-h-tap flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-lg text-ink-muted">
          {summary.open} open · {summary.done} done
        </p>
        {summary.done > 0 && (
          <Button variant="secondary" onClick={clearDone}>
            Clear done
          </Button>
        )}
      </div>
    </Page>
  );
}
