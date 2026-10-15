// @ts-check
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

const SCREENS = [
  { name: "home", open: null },
  { name: "lesson", open: '[data-act="lessons"]', wait: ".answer" },
  { name: "progress", open: '[data-act="progress"]', wait: "h1" },
  { name: "grammar library", open: '[data-act="grammar-list"]', wait: "h1" },
  { name: "reading", open: '[data-act="reading"]', wait: "h1" },
  { name: "stats", open: '[data-act="stats"]', wait: ".heat" },
  { name: "projections", open: '[data-act="projections"]', wait: "h1" },
  { name: "extra study", open: '[data-act="extra"]', wait: "h1" },
  { name: "leeches", open: '[data-act="leeches"]', wait: "h1" },
  { name: "help", open: '[data-act="help"]', wait: "h1" },
  { name: "credits", open: '[data-act="credits"]', wait: "#credits-list" },
];

for (const screen of SCREENS) {
  test(`${screen.name} has no accessibility violations`, async ({ page }) => {
    await page.goto("/");
    if (screen.open) {
      await page.click(screen.open);
      if (screen.wait) await page.waitForSelector(screen.wait);
    }
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
