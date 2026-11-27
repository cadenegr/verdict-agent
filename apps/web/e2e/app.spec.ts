import { expect, test } from "@playwright/test";

test("add, finish and clear a task", async ({ page }) => {
  await page.goto("/tasks");

  await page.getByLabel("New task").fill("Try the app");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("1 open · 0 done")).toBeVisible();

  await page.getByRole("checkbox").check();
  await expect(page.getByText("0 open · 1 done")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Try the app")).toBeVisible();

  await page.getByRole("button", { name: "Clear done" }).click();
  await expect(page.getByText("Nothing to do yet.")).toBeVisible();
});

test("is installable as a PWA", async ({ page }) => {
  await page.goto("/");

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBeTruthy();
  const manifest = await (await page.request.get(manifestHref!)).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.some((icon: { sizes: string }) => icon.sizes === "512x512")).toBe(true);

  const hasServiceWorker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration.active);
  });
  expect(hasServiceWorker).toBe(true);
});

test("opens without a network connection", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // the service worker now controls the page

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Tasks" }).first().click();
  await expect(page.getByLabel("New task")).toBeVisible();
});
