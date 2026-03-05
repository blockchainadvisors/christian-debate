import { test } from "@playwright/test";

const THEMES = [
  "cathedral-dark",
  "warm-parchment",
  "nordic-clean",
  "ink-and-paper",
  "forest-deep",
  "neon-terminal",
  "byzantine-gold",
  "soft-cloud",
  "art-deco",
  "slate-academic",
];

const SCREENSHOT_DIR = "./e2e/screenshots/themes";

async function applyTheme(page: import("@playwright/test").Page, theme: string) {
  // Set localStorage before navigation so ThemeProvider picks it up
  await page.addInitScript((t) => {
    localStorage.setItem("cd-theme", t);
  }, theme);
}

async function waitForTheme(page: import("@playwright/test").Page, theme: string) {
  await page.waitForLoadState("domcontentloaded");
  // Also force-set the data-theme attribute in case React hydration is slow
  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
  }, theme);
  // Wait for theme CSS to take effect and fonts to start loading
  await page.waitForTimeout(800);
}

for (const theme of THEMES) {
  test.describe(`Theme: ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await applyTheme(page, theme);
    });

    test(`homepage`, async ({ page }) => {
      await page.goto("/");
      await waitForTheme(page, theme);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${theme}-homepage.png`,
        fullPage: true,
      });
    });

    test(`debate page`, async ({ page }) => {
      await page.goto("/d/is-sola-scriptura-biblical");
      await waitForTheme(page, theme);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${theme}-debate.png`,
        fullPage: true,
      });
    });

    test(`debates listing`, async ({ page }) => {
      await page.goto("/debates");
      await waitForTheme(page, theme);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${theme}-debates.png`,
        fullPage: true,
      });
    });
  });
}
