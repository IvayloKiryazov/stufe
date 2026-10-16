import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SCREENS: { name: string; hash: string }[] = [
  { name: "today", hash: "" },
  { name: "study", hash: "#/study" },
  { name: "browse", hash: "#/browse" },
  { name: "grammar", hash: "#/grammar" },
  { name: "reading", hash: "#/reading" },
  { name: "dictation", hash: "#/dictation" },
  { name: "translate", hash: "#/translate" },
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
