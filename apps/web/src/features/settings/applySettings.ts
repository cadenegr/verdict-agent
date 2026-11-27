import type { Settings } from "@app/shared";

/**
 * Puts the settings on <html>, where src/styles/index.css reads them:
 * data-theme sets light or dark (none = follow the device), data-text-size scales every rem.
 */
export function applySettings(
  { theme, textSize }: Settings,
  root = document.documentElement,
): void {
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;

  if (textSize === "standard") delete root.dataset.textSize;
  else root.dataset.textSize = textSize;
}
