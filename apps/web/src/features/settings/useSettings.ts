import { useEffect, useState } from "react";
import type { Settings } from "@app/shared";
import { applySettings } from "./applySettings.ts";
import { loadSettings, saveSettings } from "./settingsStorage.ts";

// Connects the settings screen to storage and to the page.
export function useSettings() {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    saveSettings(settings);
    applySettings(settings);
  }, [settings]);

  function change<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return { settings, change };
}
