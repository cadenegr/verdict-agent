import { z } from "zod";

/** Stackgini writes the overall call capitalised: Green, Yellow, Red. */
export const OVERALLS = ["Green", "Yellow", "Red"] as const;

/** One row of the organizers' sample file, in their column order. */
export const StackginiRowSchema = z.object({
  /** The organizers' id, empty for lists without one. */
  id: z.string(),
  url: z.url(),
  product: z.string().min(1),
  /** As the organizers gave it; empty rather than guessed. */
  vendor: z.string(),
  overall: z.enum(OVERALLS),
  green_flags: z.string(),
  yellow_flags: z.string(),
  red_flags: z.string(),
  reasoning: z.string(),
});

export const STACKGINI_COLUMNS = StackginiRowSchema.keyof().options;

export type StackginiRow = z.infer<typeof StackginiRowSchema>;
