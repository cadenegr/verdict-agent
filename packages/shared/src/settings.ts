import { z } from "zod";

// The person's display settings. Part of the design preset, not example content:
// every app keeps them. Unknown or missing values fall back to the defaults.

export const THEMES = ["system", "light", "dark"] as const;
export const TEXT_SIZES = ["standard", "large", "extra-large"] as const;

export const SettingsSchema = z.object({
  theme: z.enum(THEMES).catch("system"),
  textSize: z.enum(TEXT_SIZES).catch("standard"),
});

export type Settings = z.infer<typeof SettingsSchema>;
export type Theme = Settings["theme"];
export type TextSize = Settings["textSize"];

export const DEFAULT_SETTINGS: Settings = { theme: "system", textSize: "standard" };
