import { z } from "zod";

export const TITLE_MAX_LENGTH = 200;

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(TITLE_MAX_LENGTH),
  done: z.boolean(),
  createdAt: z.iso.datetime(),
});

export const TaskListSchema = z.array(TaskSchema);

export type Task = z.infer<typeof TaskSchema>;
