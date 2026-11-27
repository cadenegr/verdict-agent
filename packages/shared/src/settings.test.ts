import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, SettingsSchema } from "./settings.ts";

describe("SettingsSchema", () => {
  it("keeps valid settings", () => {
    const settings = { theme: "dark", textSize: "large" };
    expect(SettingsSchema.parse(settings)).toEqual(settings);
  });

  it("falls back to the defaults for missing or unknown values", () => {
    expect(SettingsSchema.parse({})).toEqual(DEFAULT_SETTINGS);
    expect(SettingsSchema.parse({ theme: "purple", textSize: 3 })).toEqual(DEFAULT_SETTINGS);
  });
});
