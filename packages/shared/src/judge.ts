import { z } from "zod";
import { RatingSchema } from "./verdict.ts";

/** One reason from the Claude judge: a flag, a sentence a human can check, and its link. */
export const JudgeReasonSchema = z.object({
  flag: RatingSchema,
  note: z.string().min(1),
  url: z.url(),
});

/** The Claude judge's answer for one product (decision 7). */
export const JudgeReplySchema = z.object({
  rating: RatingSchema,
  confidence: z.number().min(0).max(1),
  reasons: z.array(JudgeReasonSchema).min(1),
});

export type JudgeReply = z.infer<typeof JudgeReplySchema>;
