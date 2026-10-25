import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SCREENS: { name: string; hash: string }[] = [
  { name: "today", hash: "" },
  { name: "study", hash: "#/study" },
  { name: "browse", hash: "#/browse" },
  { name: "grammar", hash: "#/grammar" },
  { name: "reading", hash: "#/reading" },
  { name: "listening", hash: "#/listening" },
  { name: "pronunciation", hash: "#/pronunciation" },
  { name: "speaking", hash: "#/speaking" },
  { name: "writing", hash: "#/writing" },
  { name: "dictation", hash: "#/dictation" },
  { name: "translate", hash: "#/translate" },
  { name: "search", hash: "#/search" },
  { name: "stats", hash: "#/stats" },
  { name: "settings", hash: "#/settings" },
  { name: "credits", hash: "#/credits" },
  { name: "help", hash: "#/help" },
];

for (const screen of SCREENS) {
  test(`${screen.name} has no accessibility violations`, async ({ page }) => {
    await page.goto("/" + screen.hash);
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

for (const tab of ["Levels", "Projections"]) {
  test(`stats ${tab} tab has no accessibility violations`, async ({ page }) => {
    await page.goto("/#/stats");
    await page.getByRole("tab", { name: tab }).click();
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
