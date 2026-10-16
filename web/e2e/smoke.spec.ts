import { expect, test } from "@playwright/test";

test("app loads with navigation and Today", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("navigation")).toBeVisible();
});

test("runs a lesson into a review", async ({ page }) => {
  await page.goto("/#/study");
  await page.getByRole("button", { name: "Start lessons" }).click();
  for (let i = 0; i < 12; i++) {
    if (await page.locator('input[aria-label="Your answer"]').count()) break;
    const next = page.getByRole("button", { name: /Next|Add to reviews/ });
    if (!(await next.count())) break;
    await next.first().click();
  }
  const input = page.locator('input[aria-label="Your answer"]');
  await expect(input).toBeVisible();
  await input.fill("x");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText(/Correct|Not quite/)).toBeVisible();
});

test("theme toggle switches the document theme", async ({ page }) => {
  await page.goto("/#/settings");
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("grammar point cram starts a session", async ({ page }) => {
  await page.goto("/#/grammar");
  await page.locator('a[href*="#/grammar/"]').first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Cram this point" }).click();
  await expect(page.locator('input[aria-label="Your answer"]')).toBeVisible();
});
