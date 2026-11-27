import { z } from "zod";
import { ProductVerdictSchema, VerdictSchema } from "./verdict.ts";

/** What a human said about a product in a test set: never `unsure`. */
export const LabelSchema = VerdictSchema.exclude(["unsure"]);

/** A product to judge: a name for people, a URL for the agent. */
export const ProductSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
});

export const LabelledProductSchema = ProductSchema.extend({
  label: LabelSchema,
  reason: z.string(),
});

/** `fixtures/test-products.json` and any list in the same shape. */
export const TestSetSchema = z.object({
  note: z.string().optional(),
  products: z.array(LabelledProductSchema),
});

/** One line of `live/verdicts.jsonl`. */
export const VerdictLineSchema = ProductVerdictSchema.extend({
  name: z.string().min(1),
  checkedAt: z.iso.datetime(),
});

export type Label = z.infer<typeof LabelSchema>;
export type LabelledProduct = z.infer<typeof LabelledProductSchema>;
export type TestSet = z.infer<typeof TestSetSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type VerdictLine = z.infer<typeof VerdictLineSchema>;
