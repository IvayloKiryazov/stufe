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
