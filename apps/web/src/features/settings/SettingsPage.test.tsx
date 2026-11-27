import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SettingsPage } from "./SettingsPage.tsx";

const root = document.documentElement;

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    delete root.dataset.theme;
    delete root.dataset.textSize;
  });
  afterEach(cleanup);

  it("follows the device by default", () => {
    render(<SettingsPage />);
    expect(screen.getByLabelText<HTMLInputElement>("Same as this device").checked).toBe(true);
    expect(root.dataset.theme).toBeUndefined();
  });

  it("applies and keeps a chosen theme and text size", () => {
    const first = render(<SettingsPage />);
    fireEvent.click(screen.getByLabelText("Dark"));
    fireEvent.click(screen.getByLabelText("Extra large"));

    expect(root.dataset.theme).toBe("dark");
    expect(root.dataset.textSize).toBe("extra-large");

    first.unmount();
    render(<SettingsPage />);
    expect(screen.getByLabelText<HTMLInputElement>("Dark").checked).toBe(true);
  });
});
