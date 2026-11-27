import type { TextSize, Theme } from "@app/shared";
import { Card, Page, RadioGroup } from "../../components/ui/index.ts";
import { useSettings } from "./useSettings.ts";

const themeOptions: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: "system", label: "Same as this device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const textSizeOptions: ReadonlyArray<{ value: TextSize; label: string }> = [
  { value: "standard", label: "Standard" },
  { value: "large", label: "Large" },
  { value: "extra-large", label: "Extra large" },
];

export function SettingsPage() {
  const { settings, change } = useSettings();

  return (
    <Page title="Settings" intro="Changes apply right away and are kept on this device.">
      <Card>
        <RadioGroup
          label="Colors"
          value={settings.theme}
          options={themeOptions}
          onChange={(theme) => change("theme", theme)}
        />
      </Card>
      <Card>
        <RadioGroup
          label="Text size"
          value={settings.textSize}
          options={textSizeOptions}
          onChange={(textSize) => change("textSize", textSize)}
        />
      </Card>
    </Page>
  );
}
