import { expect, test } from "@playwright/test";

// Per-screen interaction tests (see issue #106/#122/#123/#134).

test("listening: an answer option can be selected", async ({ page }) => {
  await page.goto("/#/listening");
  const first = page.getByRole("radio").first();
  await first.check();
  await expect(first).toBeChecked();
});

test("settings: review reminders toggle sticks", async ({ page }) => {
  await page.goto("/#/settings");
  const reminders = page.getByLabel("Review reminders");
  await reminders.check();
  await expect(reminders).toBeChecked();
  await reminders.uncheck();
  await expect(reminders).not.toBeChecked();
});

test("settings: vacation mode toggle sticks", async ({ page }) => {
  await page.goto("/#/settings");
  const vacation = page.getByLabel("Vacation mode (pause new lessons)");
  await vacation.check();
  await expect(vacation).toBeChecked();
});

test("reading: answers can be selected, checked and scored", async ({ page }) => {
  await page.goto("/#/reading");
  await page.locator('a[href*="#/reading/"]').first().click();
  const first = page.getByRole("radio").first();
  await first.check();
  await expect(first).toBeChecked();
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByText(/\d+ \/ \d+ correct/)).toBeVisible();
});

test("dictation: an answer is graded", async ({ page }) => {
  await page.goto("/#/dictation");
  await page.locator('input[aria-label="Type what you hear"]').fill("zzz");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText(/Not quite|Correct/)).toBeVisible();
});

test("translate: an answer is graded", async ({ page }) => {
  await page.goto("/#/translate");
  await page.locator('input[aria-label="Your German sentence"]').fill("zzz");
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByText(/Correct|Close/)).toBeVisible();
});

test("browse: starting a course group opens a study session", async ({ page }) => {
  await page.goto("/#/browse");
  await page.locator('a[href*="study?group="]').first().click();
  await expect(page.getByRole("button", { name: "Wrap up" })).toBeVisible();
});
