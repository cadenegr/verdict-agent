import { DEFAULT_SETTINGS, SettingsSchema, type Settings } from "@app/shared";

// Storage adapter: the only file that knows settings are kept in localStorage.

export const STORAGE_KEY = "app.settings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = SettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be full or blocked (private mode). The choice still applies until reload.
  }
}
