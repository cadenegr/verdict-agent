import { expect, test } from "@playwright/test";

const heading = (page: import("@playwright/test").Page) => page.getByRole("heading", { level: 1 });

test("header and footer reach every screen", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("navigation", { name: "Main" });
  const footer = page.getByRole("navigation", { name: "Sections" });

  await expect(header.getByRole("button", { name: "Back" })).toBeDisabled();

  await footer.getByRole("link", { name: "Tasks" }).click();
  await expect(heading(page)).toHaveText("Tasks");

  await footer.getByRole("link", { name: "Settings" }).click();
  await expect(heading(page)).toHaveText("Settings");

  await footer.getByRole("link", { name: "Information" }).click();
  await expect(heading(page)).toHaveText("Information");

  await header.getByRole("link", { name: "Profile" }).click();
  await expect(heading(page)).toHaveText("Profile");
  await expect(header.getByRole("link", { name: "Profile" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await header.getByRole("button", { name: "Back" }).click();
  await expect(heading(page)).toHaveText("Information");

  await header.getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("settings change the theme and text size, and are kept", async ({ page }) => {
  await page.goto("/settings");
  const html = page.locator("html");

  await page.getByLabel("Dark").check();
  await page.getByLabel("Large", { exact: true }).check();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(html).toHaveAttribute("data-text-size", "large");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe("rgb(13, 17, 23)"); // dark --color-canvas
});
