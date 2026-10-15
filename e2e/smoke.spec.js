// @ts-check
const { test, expect } = require("@playwright/test");

test("loads the deck and runs a lesson into a review", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Stufe");
  await expect(page.locator('[data-act="lessons"]')).toBeEnabled();

  // start a lesson and step through the batch until reviews begin
  await page.click('[data-act="lessons"]');
  await expect(page.locator(".answer")).toBeVisible();
  for (let i = 0; i < 12; i++) {
    if (await page.locator("#ans").count()) break;
    await page.click("button.primary");
  }

  // now we should be in a review with an input
  await expect(page.locator("#ans")).toBeVisible();
  await page.fill("#ans", "zzz");
  await page.click('[data-act="check"]');
  await expect(page.locator(".verdict")).toBeVisible();
});

test("credits screen lists sources", async ({ page }) => {
  await page.goto("/");
  await page.click('[data-act="credits"]');
  await expect(page.locator("h1")).toHaveText("Credits & licenses");
  await expect(page.locator("#credits-list")).toContainText("tatoeba.org");
});

test("group browser expands a level and starts a group lesson", async ({ page }) => {
  await page.goto("/");
  await page.click('[data-act="toggle-level"]');
  await expect(page.locator(".grp-name").first()).toBeVisible();
  await page.locator('[data-act="group"]').first().click();
  await expect(page.locator(".rule b")).toBeVisible();
  await expect(page.locator(".answer")).toBeVisible();
});

test("grammar point page opens and cram starts a review", async ({ page }) => {
  await page.goto("/");
  await page.click('[data-act="grammar-list"]');
  await page.locator('[data-act="grammar"]').first().click();
  await expect(page.locator(".rule b")).toBeVisible();
  await page.click('[data-act="cram"]');
  await expect(page.locator("#ans")).toBeVisible();
});
