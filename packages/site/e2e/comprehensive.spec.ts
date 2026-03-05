import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "./e2e/screenshots";
const DEBATE_SLUG = "is-sola-scriptura-biblical";

test.describe("Landing Page", () => {
  test("renders homepage with featured debates", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-homepage.png`,
      fullPage: true,
    });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Debates Listing", () => {
  test("shows all debates with search and filters", async ({ page }) => {
    await page.goto("/debates");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-debates-listing.png`,
      fullPage: true,
    });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Debate Detail — Thread View", () => {
  test("loads debate with comments in thread view", async ({ page }) => {
    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-debate-thread-view.png`,
      fullPage: true,
    });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Debate Detail — Sides View", () => {
  test("shows comments separated by stance", async ({ page }) => {
    await page.goto(`/d/${DEBATE_SLUG}?view=sides`);
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-debate-sides-view.png`,
      fullPage: true,
    });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Debate Detail — Best Exchanges View", () => {
  test("shows top exchanges between opposing sides", async ({ page }) => {
    await page.goto(`/d/${DEBATE_SLUG}?view=exchanges`);
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-debate-exchanges-view.png`,
      fullPage: true,
    });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Debate Detail — Verdict View", () => {
  test("shows neutral verdict tally", async ({ page }) => {
    await page.goto(`/d/${DEBATE_SLUG}?view=verdict`);
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-debate-verdict-view.png`,
      fullPage: true,
    });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Login Page", () => {
  test("renders login form", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-login-page.png`,
      fullPage: true,
    });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("API — Debates List", () => {
  test("returns JSON list of debates", async ({ request }) => {
    const response = await request.get("/api/debates");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("title");
    expect(data[0]).toHaveProperty("slug");
  });
});

test.describe("API — Debate Detail", () => {
  test("returns single debate by slug", async ({ request }) => {
    const response = await request.get(`/api/debates/${DEBATE_SLUG}`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("slug", DEBATE_SLUG);
    expect(data).toHaveProperty("title");
    expect(data).toHaveProperty("sideALabel");
    expect(data).toHaveProperty("sideBLabel");
  });
});

test.describe("API — Comments", () => {
  test("returns comments for a debate", async ({ request }) => {
    const response = await request.get(
      `/api/debates/${DEBATE_SLUG}/comments`
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("content");
    expect(data[0]).toHaveProperty("stanceSide");
  });
});

test.describe("API — Comments by Side", () => {
  test("returns comments filtered by stance", async ({ request }) => {
    const response = await request.get(
      `/api/debates/${DEBATE_SLUG}/comments/by-side?side=side_a`
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("sideA");
    expect(Array.isArray(data.sideA)).toBeTruthy();
  });
});

test.describe("API — Stances", () => {
  test("returns stance declarations for a debate", async ({ request }) => {
    const response = await request.get(
      `/api/debates/${DEBATE_SLUG}/stances`
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("stances");
    expect(data.stances.length).toBeGreaterThan(0);
  });
});

test.describe("API — Exchanges", () => {
  test("returns best exchanges for a debate", async ({ request }) => {
    const response = await request.get(
      `/api/debates/${DEBATE_SLUG}/exchanges`
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("exchanges");
    expect(Array.isArray(data.exchanges)).toBeTruthy();
  });
});

test.describe("API — Verdict", () => {
  test("returns verdict data for a debate", async ({ request }) => {
    const response = await request.get(
      `/api/debates/${DEBATE_SLUG}/verdict`
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("tally");
    expect(data).toHaveProperty("pinnedComments");
  });
});

test.describe("API — Analytics", () => {
  test("returns analytics data for a debate", async ({ request }) => {
    const response = await request.get(
      `/api/debates/${DEBATE_SLUG}/analytics`
    );
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toBeTruthy();
  });
});

test.describe("Other Debates — Screenshot Tour", () => {
  const otherSlugs = [
    "should-women-be-ordained-as-pastors",
    "was-the-reformation-necessary",
    "can-evolution-and-christianity-be-reconciled",
  ];

  for (const [i, slug] of otherSlugs.entries()) {
    test(`debate: ${slug}`, async ({ page }) => {
      await page.goto(`/d/${slug}`);
      await page.waitForLoadState("domcontentloaded");
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/08-${i}-debate-${slug.slice(0, 30)}.png`,
        fullPage: true,
      });
      await expect(page.locator("body")).toBeVisible();
    });
  }
});

test.describe("Network Page", () => {
  test("renders network/federation page", async ({ page }) => {
    await page.goto("/network");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-network-page.png`,
      fullPage: true,
    });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Moderation Page", () => {
  test("renders moderation dashboard", async ({ page }) => {
    await page.goto("/moderation");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-moderation-page.png`,
      fullPage: true,
    });
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Mobile Viewport", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("homepage on mobile", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-mobile-homepage.png`,
      fullPage: true,
    });
  });

  test("debate thread on mobile", async ({ page }) => {
    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-mobile-debate-thread.png`,
      fullPage: true,
    });
  });

  test("debates listing on mobile", async ({ page }) => {
    await page.goto("/debates");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-mobile-debates-listing.png`,
      fullPage: true,
    });
  });
});
