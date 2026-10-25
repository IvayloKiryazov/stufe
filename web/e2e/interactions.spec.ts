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

test("checkpoint: a scored level session starts", async ({ page }) => {
  await page.goto("/#/study?mode=checkpoint&level=0");
  await expect(page.locator('input[aria-label="Your answer"]')).toBeVisible();
});

test("vocab cloze: a fill-in-the-blank card starts", async ({ page }) => {
  await page.goto("/#/study?mode=practice&group=a1-core-cloze&level=0");
  await expect(page.getByText("Fill in the missing word")).toBeVisible();
  await expect(page.locator('input[aria-label="Your answer"]')).toBeVisible();
});

test("settings: every control is usable", async ({ page }) => {
  await page.goto("/#/settings");
  await page.getByLabel("Unlock all levels").check();
  await expect(page.getByLabel("Unlock all levels")).toBeChecked();
  await page.getByLabel("Audio (browser German voices)").uncheck();
  await expect(page.getByLabel("Audio (browser German voices)")).not.toBeChecked();
  await page.getByLabel("New items per lesson").fill("7");
  await expect(page.getByLabel("New items per lesson")).toHaveValue("7");
  await page.getByLabel("Daily new goal").fill("30");
  await expect(page.getByLabel("Daily new goal")).toHaveValue("30");
  await page.getByLabel("Article (gender) track").uncheck();
  await expect(page.getByLabel("Article (gender) track")).not.toBeChecked();
});

test("browse: a known word can be removed from the first pass", async ({ page }) => {
  await page.goto("/#/browse");
  await page.getByRole("button", { name: "Vocabulary" }).click();
  await page.getByRole("button", { name: "I know this" }).first().click();
  await expect(page.getByText("known").first()).toBeVisible();
});

test("i18n: switching the interface language localizes screens", async ({ page }) => {
  await page.goto("/#/settings");
  await page.getByLabel("Interface language").click();
  await page.getByRole("option", { name: "Deutsch" }).click();
  await expect(page.getByRole("heading", { name: "Einstellungen" })).toBeVisible();
  await page.goto("/#/study");
  await expect(page.getByRole("heading", { name: "Lernen", exact: true })).toBeVisible();
  await expect(page.getByText("Wiederholungen").first()).toBeVisible();
  await page.goto("/#/browse");
  await expect(page.getByRole("heading", { name: "Übersicht", exact: true })).toBeVisible();
});
