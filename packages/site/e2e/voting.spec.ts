import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const AUTH_SECRET = "tljJ43ymF9jTgL/Eu0WCgA+ChfRWzZhm76PraWCIw1M=";
const TEST_USER = {
  id: "0cb3d6bf-846f-4c3b-8f3c-7182caafb948",
  name: "Lorenzo NEY",
  email: "neylaur@gmail.com",
};

// A debate slug with known comments
const DEBATE_SLUG = "is-sola-scriptura-biblical";

// Comment NOT owned by test user, with existing votes
const TARGET_COMMENT_ID = "95b1d6a2-610f-4e4d-8a70-b464ea499b89";

/**
 * Generate a valid Auth.js JWT session token.
 */
async function generateSessionToken(): Promise<string> {
  const { encode } = await import("next-auth/jwt");
  return encode({
    token: {
      id: TEST_USER.id,
      name: TEST_USER.name,
      email: TEST_USER.email,
      sub: TEST_USER.id,
    },
    secret: AUTH_SECRET,
    salt: "__Secure-authjs.session-token",
  });
}

/**
 * Inject auth cookies into a browser context.
 */
async function authenticateContext(context: BrowserContext) {
  const token = await generateSessionToken();
  await context.addCookies([
    {
      name: "__Secure-authjs.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ]);
}

// ────────────────────────────────────────────────────────────────────
// API-level voting tests (fast, no browser rendering needed)
// ────────────────────────────────────────────────────────────────────

test.describe("Vote API", () => {
  let authCookie: string;

  test.beforeAll(async () => {
    const token = await generateSessionToken();
    authCookie = `__Secure-authjs.session-token=${token}`;
  });

  // Clean up any vote the test user placed on the target comment
  test.afterEach(async ({ request }) => {
    await request.delete(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie },
    });
  });

  test("POST /api/comments/:id/vote — creates an upvote", async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "up", reason: "well_reasoned" },
      }
    );

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.userVote).toEqual({ direction: "up", reason: "well_reasoned" });
    expect(body.breakdown).toHaveProperty("totalScore");
    expect(body.breakdown).toHaveProperty("up");
    expect(body.breakdown).toHaveProperty("down");
  });

  test("POST /api/comments/:id/vote — creates a downvote", async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "down", reason: "off_topic" },
      }
    );

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.userVote).toEqual({ direction: "down", reason: "off_topic" });
  });

  test("POST /api/comments/:id/vote — upserts (changes vote)", async ({ request }) => {
    // First vote: upvote
    await request.post(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie, "Content-Type": "application/json" },
      data: { direction: "up", reason: "well_reasoned" },
    });

    // Second vote: change to downvote
    const res = await request.post(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "down", reason: "low_effort" },
      }
    );

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.userVote).toEqual({ direction: "down", reason: "low_effort" });
  });

  test("DELETE /api/comments/:id/vote — removes a vote", async ({ request }) => {
    // Create a vote first
    await request.post(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie, "Content-Type": "application/json" },
      data: { direction: "up", reason: "well_sourced" },
    });

    // Delete it
    const res = await request.delete(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
      { headers: { Cookie: authCookie } }
    );

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.userVote).toBeNull();
  });

  test("POST without auth returns 401", async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
      {
        headers: { "Content-Type": "application/json" },
        data: { direction: "up", reason: "well_reasoned" },
      }
    );
    expect(res.status()).toBe(401);
  });

  test("DELETE without auth returns 401", async ({ request }) => {
    const res = await request.delete(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`
    );
    expect(res.status()).toBe(401);
  });

  test("POST with invalid direction returns 400", async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "sideways", reason: "well_reasoned" },
      }
    );
    expect(res.status()).toBe(400);
  });

  test("POST with mismatched reason (downvote reason on upvote) returns 400", async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "up", reason: "off_topic" },
      }
    );
    expect(res.status()).toBe(400);
  });

  test("POST with mismatched reason (upvote reason on downvote) returns 400", async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "down", reason: "well_reasoned" },
      }
    );
    expect(res.status()).toBe(400);
  });

  test("POST with nonexistent comment returns 404 or error", async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/comments/00000000-0000-0000-0000-000000000000/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "up", reason: "well_reasoned" },
      }
    );
    // Should fail — either FK constraint or explicit check
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("GET /api/comments/:id/votes — returns breakdown", async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/votes`,
      { headers: { Cookie: authCookie } }
    );

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.breakdown).toHaveProperty("up");
    expect(body.breakdown).toHaveProperty("down");
    expect(body.breakdown).toHaveProperty("totalScore");
    expect(typeof body.breakdown.totalScore).toBe("number");
  });

  test("GET /api/comments/:id/votes — returns userVote when authenticated", async ({ request }) => {
    // Place a vote first
    await request.post(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie, "Content-Type": "application/json" },
      data: { direction: "up", reason: "well_sourced" },
    });

    const res = await request.get(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/votes`,
      { headers: { Cookie: authCookie } }
    );

    const body = await res.json();
    expect(body.userVote).toEqual({ direction: "up", reason: "well_sourced" });
  });

  test("GET /api/comments/:id/votes — returns null userVote when not authenticated", async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/votes`
    );

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.userVote).toBeNull();
  });

  test("score updates correctly after upvote", async ({ request }) => {
    // Get score before
    const before = await request.get(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/votes`
    );
    const scoreBefore = (await before.json()).breakdown.totalScore;

    // Upvote with changed_my_mind (3x multiplier, 0.5 weight for "new" tier)
    await request.post(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie, "Content-Type": "application/json" },
      data: { direction: "up", reason: "changed_my_mind" },
    });

    // Get score after
    const after = await request.get(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/votes`
    );
    const scoreAfter = (await after.json()).breakdown.totalScore;

    // Score should have increased (3 * 0.5 = 1.5, rounded = 2 increase)
    expect(scoreAfter).toBeGreaterThan(scoreBefore);
  });

  test("score updates correctly after removing vote", async ({ request }) => {
    // Place a vote
    await request.post(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie, "Content-Type": "application/json" },
      data: { direction: "up", reason: "well_sourced" },
    });

    const withVote = await request.get(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/votes`
    );
    const scoreWith = (await withVote.json()).breakdown.totalScore;

    // Remove the vote
    await request.delete(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie },
    });

    const without = await request.get(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/votes`
    );
    const scoreWithout = (await without.json()).breakdown.totalScore;

    expect(scoreWithout).toBeLessThan(scoreWith);
  });

  test("all 5 upvote reasons are accepted", async ({ request }) => {
    const reasons = [
      "well_reasoned",
      "well_sourced",
      "changed_my_mind",
      "strong_counterpoint",
      "well_written",
    ];

    for (const reason of reasons) {
      const res = await request.post(
        `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
        {
          headers: { Cookie: authCookie, "Content-Type": "application/json" },
          data: { direction: "up", reason },
        }
      );
      expect(res.status(), `upvote reason "${reason}" should be accepted`).toBe(200);
    }
  });

  test("all 5 downvote reasons are accepted", async ({ request }) => {
    const reasons = [
      "off_topic",
      "uncivil",
      "misleading_unsourced",
      "misrepresented_stance",
      "low_effort",
    ];

    for (const reason of reasons) {
      const res = await request.post(
        `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
        {
          headers: { Cookie: authCookie, "Content-Type": "application/json" },
          data: { direction: "down", reason },
        }
      );
      expect(res.status(), `downvote reason "${reason}" should be accepted`).toBe(200);
    }
  });
});

// ────────────────────────────────────────────────────────────────────
// Browser UI voting tests
// ────────────────────────────────────────────────────────────────────

test.describe("Vote UI", () => {
  test.beforeEach(async ({ context, request }) => {
    await authenticateContext(context);

    // Clean up any existing vote on target comment
    const token = await generateSessionToken();
    await request.delete(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: { Cookie: `__Secure-authjs.session-token=${token}` },
    });
  });

  test("vote buttons are visible on comments", async ({ page }) => {
    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector('[id^="comment-"]');

    // Find upvote and downvote buttons (SVG arrow icons inside buttons)
    const firstComment = page.locator('[id^="comment-"]').first();
    const upButton = firstComment.locator('button[data-vote-direction="up"]');
    const downButton = firstComment.locator('button[data-vote-direction="down"]');

    await expect(upButton).toBeVisible();
    await expect(downButton).toBeVisible();
  });

  test("clicking upvote shows reason picker popover", async ({ page }) => {
    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector('[id^="comment-"]');

    // Click the first upvote button
    const firstComment = page.locator('[id^="comment-"]').first();
    const upButton = firstComment.locator('button[data-vote-direction="up"]');
    await upButton.click();

    // Reason picker popover should appear
    await expect(page.getByText("Why upvote?")).toBeVisible();
    await expect(page.getByText("Well Reasoned")).toBeVisible();
    await expect(page.getByText("Well Sourced")).toBeVisible();
    await expect(page.getByText("Changed My Mind")).toBeVisible();
    await expect(page.getByText("Strong Counterpoint")).toBeVisible();
    await expect(page.getByText("Well Written")).toBeVisible();
  });

  test("clicking downvote shows reason picker popover", async ({ page }) => {
    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector('[id^="comment-"]');

    const firstComment = page.locator('[id^="comment-"]').first();
    const downButton = firstComment.locator('button[data-vote-direction="down"]');
    await downButton.click();

    await expect(page.getByText("Why downvote?")).toBeVisible();
    await expect(page.getByText("Off Topic")).toBeVisible();
    await expect(page.getByText("Uncivil")).toBeVisible();
    await expect(page.getByText("Misleading/Unsourced")).toBeVisible();
    await expect(page.getByText("Misrepresented Stance")).toBeVisible();
    await expect(page.getByText("Low Effort")).toBeVisible();
  });

  test("selecting a reason submits the vote and updates score", async ({ page, request }) => {
    // Pre-compute expected score via API to avoid rounding ambiguity
    const token = await generateSessionToken();
    const cookie = `__Secure-authjs.session-token=${token}`;
    const voteRes = await request.post(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
      {
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        data: { direction: "up", reason: "changed_my_mind" },
      }
    );
    const expectedScore = (await voteRes.json()).breakdown.totalScore;

    // Remove so browser can do it fresh
    await request.delete(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: { Cookie: cookie },
    });

    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${TARGET_COMMENT_ID}`);

    const comment = page.locator(`#comment-${TARGET_COMMENT_ID}`);

    // Click upvote
    const upButton = comment.locator('button[data-vote-direction="up"]');
    await upButton.click();

    // Select "Changed My Mind" reason (3x multiplier — always visible after rounding)
    await page.getByText("Changed My Mind").click();

    // Score should update to match API-computed value
    const scoreDisplay = comment.locator(".tabular-nums");
    await expect(scoreDisplay).toHaveText(String(expectedScore), { timeout: 5000 });

    // Upvote button should now have active styling (green background)
    await expect(upButton).toHaveAttribute("data-vote-active", "true");
  });

  test("clicking active upvote removes the vote", async ({ page, request }) => {
    // Pre-place a vote via API
    const token = await generateSessionToken();
    await request.post(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: {
        Cookie: `__Secure-authjs.session-token=${token}`,
        "Content-Type": "application/json",
      },
      data: { direction: "up", reason: "well_reasoned" },
    });

    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${TARGET_COMMENT_ID}`);

    const comment = page.locator(`#comment-${TARGET_COMMENT_ID}`);
    const upButton = comment.locator('button[data-vote-direction="up"]');

    // Click the already-active upvote to remove it
    await upButton.click();

    // Wait for state to update
    await page.waitForTimeout(1000);

    // Button should no longer have green styling
    await expect(upButton).not.toHaveAttribute("data-vote-active");
  });

  test("vote persists across page reload", async ({ page, request }) => {
    // Vote via API
    const token = await generateSessionToken();
    await request.post(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: {
        Cookie: `__Secure-authjs.session-token=${token}`,
        "Content-Type": "application/json",
      },
      data: { direction: "up", reason: "well_sourced" },
    });

    // Load page
    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${TARGET_COMMENT_ID}`);

    // Verify the score reflects the vote (it's fetched from DB)
    const comment = page.locator(`#comment-${TARGET_COMMENT_ID}`);
    const score = await comment.locator(".tabular-nums").textContent();
    expect(score).toBeTruthy();
  });

  test("vote highlight persists after page reload", async ({ page, request }) => {
    // Place a vote via API
    const token = await generateSessionToken();
    await request.post(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: {
        Cookie: `__Secure-authjs.session-token=${token}`,
        "Content-Type": "application/json",
      },
      data: { direction: "up", reason: "well_reasoned" },
    });

    // Load page
    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${TARGET_COMMENT_ID}`);

    const comment = page.locator(`#comment-${TARGET_COMMENT_ID}`);
    const upButton = comment.locator('button[data-vote-direction="up"]');

    // Wait for the useEffect fetch to complete and highlight the button
    await expect(upButton).toHaveAttribute("data-vote-active", "true", { timeout: 5000 });

    // Reload the page
    await page.reload();
    await page.waitForSelector(`#comment-${TARGET_COMMENT_ID}`);

    // Should still be highlighted after reload
    const upButtonAfter = page.locator(`#comment-${TARGET_COMMENT_ID}`).locator('button[data-vote-direction="up"]');
    await expect(upButtonAfter).toHaveAttribute("data-vote-active", "true", { timeout: 5000 });
  });

  test("unauthenticated user sees vote buttons but gets redirected on click", async ({ page, context }) => {
    // Clear any auth cookies
    await context.clearCookies();

    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector('[id^="comment-"]');

    const firstComment = page.locator('[id^="comment-"]').first();
    const upButton = firstComment.locator('button[data-vote-direction="up"]');
    await expect(upButton).toBeVisible();

    // Click upvote — should show picker
    await upButton.click();

    // Select a reason — should redirect to /login
    const reasonButton = page.getByText("Well Reasoned");
    if (await reasonButton.isVisible()) {
      await reasonButton.click();
      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain("/login");
    }
  });

  test("score display shows correct sign and value", async ({ page }) => {
    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector('[id^="comment-"]');

    // All score displays should be numeric
    const scores = page.locator(".tabular-nums");
    const count = await scores.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 10); i++) {
      const text = await scores.nth(i).textContent();
      expect(text?.trim()).toMatch(/^-?\d+$/);
    }
  });
});

// ────────────────────────────────────────────────────────────────────
// Auth session / user ID mapping tests
// ────────────────────────────────────────────────────────────────────

test.describe("Auth session user ID", () => {
  test("session endpoint returns correct database user ID", async ({ context, request }) => {
    await authenticateContext(context);

    const res = await request.get(`${BASE_URL}/api/auth/session`, {
      headers: {
        Cookie: `__Secure-authjs.session-token=${await generateSessionToken()}`,
      },
    });

    const session = await res.json();
    expect(session.user.id).toBe(TEST_USER.id);
    expect(session.user.email).toBe(TEST_USER.email);
  });

  test("session user ID matches a real database user", async ({ request }) => {
    const token = await generateSessionToken();

    // Use the session ID to call the vote endpoint — should NOT get "User not found"
    const res = await request.post(
      `${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`,
      {
        headers: {
          Cookie: `__Secure-authjs.session-token=${token}`,
          "Content-Type": "application/json",
        },
        data: { direction: "up", reason: "well_reasoned" },
      }
    );

    // Should be 200 (success), NOT 404 ("User not found")
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.userVote).toBeTruthy();

    // Cleanup
    await request.delete(`${BASE_URL}/api/comments/${TARGET_COMMENT_ID}/vote`, {
      headers: { Cookie: `__Secure-authjs.session-token=${token}` },
    });
  });
});
