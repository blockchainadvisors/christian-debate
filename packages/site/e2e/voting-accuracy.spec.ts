import { test, expect, type BrowserContext } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const AUTH_SECRET = "tljJ43ymF9jTgL/Eu0WCgA+ChfRWzZhm76PraWCIw1M=";
const TEST_USER_ID = "0cb3d6bf-846f-4c3b-8f3c-7182caafb948";
const DEBATE_SLUG = "is-sola-scriptura-biblical";
const COMMENT_ID = "95b1d6a2-610f-4e4d-8a70-b464ea499b89";

async function generateSessionToken(): Promise<string> {
  const { encode } = await import("next-auth/jwt");
  return encode({
    token: {
      id: TEST_USER_ID,
      name: "Lorenzo NEY",
      email: "neylaur@gmail.com",
      sub: TEST_USER_ID,
    },
    secret: AUTH_SECRET,
    salt: "__Secure-authjs.session-token",
  });
}

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

function getCookie(token: string) {
  return `__Secure-authjs.session-token=${token}`;
}

test.describe("Voting accuracy — score calculation and display", () => {
  let authCookie: string;

  test.beforeAll(async () => {
    const token = await generateSessionToken();
    authCookie = getCookie(token);
  });

  test.beforeEach(async ({ request }) => {
    // Remove test user's vote
    await request.delete(`${BASE_URL}/api/comments/${COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie },
    });
  });

  test.afterAll(async ({ request }) => {
    // Clean up
    await request.delete(`${BASE_URL}/api/comments/${COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie },
    });
  });

  test("upvote well_sourced: API score matches DB and browser display", async ({
    page,
    context,
    request,
  }) => {
    await authenticateContext(context);

    // Get baseline score from API
    const baseRes = await request.get(
      `${BASE_URL}/api/comments/${COMMENT_ID}/votes`,
      { headers: { Cookie: authCookie } }
    );
    const baselineScore = (await baseRes.json()).breakdown.totalScore;

    // Vote via API
    const voteRes = await request.post(
      `${BASE_URL}/api/comments/${COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "up", reason: "well_sourced" },
      }
    );
    const voteBody = await voteRes.json();
    const apiScore = voteBody.breakdown.totalScore;

    // well_sourced = 2x multiplier, user is "new" tier = 0.5 weight
    // Expected: baseline + round(2 * 0.5) = baseline + 1
    expect(apiScore).toBe(baselineScore + 1);

    // Load page and check browser display
    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${COMMENT_ID}`);

    const comment = page.locator(`#comment-${COMMENT_ID}`);
    const scoreDisplay = comment.locator(".tabular-nums");
    await expect(scoreDisplay).toHaveText(String(apiScore), { timeout: 5000 });

    // Upvote button should be highlighted green
    const upButton = comment.locator(
      'button[data-vote-direction="up"]'
    );
    await expect(upButton).toHaveAttribute("data-vote-active", "true", { timeout: 5000 });
  });

  test("upvote changed_my_mind: 3x multiplier calculates correctly", async ({
    page,
    context,
    request,
  }) => {
    await authenticateContext(context);

    const baseRes = await request.get(
      `${BASE_URL}/api/comments/${COMMENT_ID}/votes`,
      { headers: { Cookie: authCookie } }
    );
    const baselineScore = (await baseRes.json()).breakdown.totalScore;

    const voteRes = await request.post(
      `${BASE_URL}/api/comments/${COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "up", reason: "changed_my_mind" },
      }
    );
    const apiScore = (await voteRes.json()).breakdown.totalScore;

    // changed_my_mind = 3x multiplier, 0.5 weight => raw 1.5, rounds to 2
    // Every vote contributes at least ±1, so contribution = max(1, 2) = 2
    expect(apiScore).toBe(baselineScore + 2);

    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${COMMENT_ID}`);
    const scoreDisplay = page
      .locator(`#comment-${COMMENT_ID}`)
      .locator(".tabular-nums");
    await expect(scoreDisplay).toHaveText(String(apiScore), { timeout: 5000 });
  });

  test("downvote low_effort: score decreases correctly", async ({
    page,
    context,
    request,
  }) => {
    await authenticateContext(context);

    const baseRes = await request.get(
      `${BASE_URL}/api/comments/${COMMENT_ID}/votes`,
      { headers: { Cookie: authCookie } }
    );
    const baselineScore = (await baseRes.json()).breakdown.totalScore;

    const voteRes = await request.post(
      `${BASE_URL}/api/comments/${COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "down", reason: "low_effort" },
      }
    );
    const apiScore = (await voteRes.json()).breakdown.totalScore;

    // low_effort = -1x, weight 0.5 => raw -0.5, but minimum is -1
    expect(apiScore).toBe(baselineScore - 1);

    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${COMMENT_ID}`);
    const scoreDisplay = page
      .locator(`#comment-${COMMENT_ID}`)
      .locator(".tabular-nums");
    await expect(scoreDisplay).toHaveText(String(apiScore), { timeout: 5000 });

    // Downvote button should be highlighted red
    const downButton = page
      .locator(`#comment-${COMMENT_ID}`)
      .locator('button[data-vote-direction="down"]');
    await expect(downButton).toHaveAttribute("data-vote-active", "true", { timeout: 5000 });
  });

  test("vote removal restores original score", async ({
    page,
    context,
    request,
  }) => {
    await authenticateContext(context);

    const baseRes = await request.get(
      `${BASE_URL}/api/comments/${COMMENT_ID}/votes`,
      { headers: { Cookie: authCookie } }
    );
    const baselineScore = (await baseRes.json()).breakdown.totalScore;

    // Add vote
    await request.post(`${BASE_URL}/api/comments/${COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie, "Content-Type": "application/json" },
      data: { direction: "up", reason: "well_reasoned" },
    });

    // Remove vote
    const delRes = await request.delete(
      `${BASE_URL}/api/comments/${COMMENT_ID}/vote`,
      { headers: { Cookie: authCookie } }
    );
    const restoredScore = (await delRes.json()).breakdown.totalScore;

    // Should be back to baseline
    expect(restoredScore).toBe(baselineScore);

    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${COMMENT_ID}`);
    const scoreDisplay = page
      .locator(`#comment-${COMMENT_ID}`)
      .locator(".tabular-nums");
    await expect(scoreDisplay).toHaveText(String(baselineScore), {
      timeout: 5000,
    });

    // Neither button should be highlighted
    const upButton = page
      .locator(`#comment-${COMMENT_ID}`)
      .locator('button[data-vote-direction="up"]');
    const downButton = page
      .locator(`#comment-${COMMENT_ID}`)
      .locator('button[data-vote-direction="down"]');
    await expect(upButton).not.toHaveAttribute("data-vote-active", "true", { timeout: 5000 });
    await expect(downButton).not.toHaveAttribute("data-vote-active", "true", { timeout: 5000 });
  });

  test("change vote direction: score swings correctly", async ({
    page,
    context,
    request,
  }) => {
    await authenticateContext(context);

    const baseRes = await request.get(
      `${BASE_URL}/api/comments/${COMMENT_ID}/votes`,
      { headers: { Cookie: authCookie } }
    );
    const baselineScore = (await baseRes.json()).breakdown.totalScore;

    // Upvote with well_sourced (2x * 0.5 = 1.0, clamped to max(1,1) = 1)
    const up = await request.post(
      `${BASE_URL}/api/comments/${COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "up", reason: "well_sourced" },
      }
    );
    const scoreAfterUp = (await up.json()).breakdown.totalScore;
    expect(scoreAfterUp).toBe(baselineScore + 1);

    // Change to downvote low_effort (-1x * 0.5 = -0.5, clamped to min(-1,-1) = -1)
    const down = await request.post(
      `${BASE_URL}/api/comments/${COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "down", reason: "low_effort" },
      }
    );
    const scoreAfterDown = (await down.json()).breakdown.totalScore;
    expect(scoreAfterDown).toBe(baselineScore - 1);

    // Net swing from up to down = 2 points
    expect(scoreAfterUp - scoreAfterDown).toBe(2);

    // Verify in browser
    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${COMMENT_ID}`);
    const scoreDisplay = page
      .locator(`#comment-${COMMENT_ID}`)
      .locator(".tabular-nums");
    await expect(scoreDisplay).toHaveText(String(scoreAfterDown), { timeout: 5000 });
  });

  test("browser upvote flow: click, pick reason, verify score updates inline", async ({
    page,
    context,
    request,
  }) => {
    await authenticateContext(context);

    // Pre-compute expected score via API (avoids rounding ambiguity)
    const voteRes = await request.post(
      `${BASE_URL}/api/comments/${COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "up", reason: "changed_my_mind" },
      }
    );
    const expectedScore = (await voteRes.json()).breakdown.totalScore;

    // Remove so browser can do it fresh
    await request.delete(`${BASE_URL}/api/comments/${COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie },
    });

    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${COMMENT_ID}`);

    const comment = page.locator(`#comment-${COMMENT_ID}`);
    const scoreDisplay = comment.locator(".tabular-nums");

    // Click upvote
    const upButton = comment.locator(
      'button[data-vote-direction="up"]'
    );
    await upButton.click();

    // Popover should appear
    await expect(page.getByText("Why upvote?")).toBeVisible();

    // Click "Changed My Mind" (3x multiplier — always produces visible score change)
    await page.getByText("Changed My Mind").click();

    // Score should update to match API-computed value
    await expect(scoreDisplay).toHaveText(String(expectedScore), { timeout: 5000 });

    // Button should be green
    await expect(upButton).toHaveAttribute("data-vote-active", "true", { timeout: 3000 });

    // Reload and verify persistence
    await page.reload();
    await page.waitForSelector(`#comment-${COMMENT_ID}`);
    const scoreAfterReload = await page
      .locator(`#comment-${COMMENT_ID}`)
      .locator(".tabular-nums")
      .textContent();
    expect(scoreAfterReload).toBe(String(expectedScore));

    // Button still green after reload
    const upButtonReloaded = page
      .locator(`#comment-${COMMENT_ID}`)
      .locator('button[data-vote-direction="up"]');
    await expect(upButtonReloaded).toHaveAttribute("data-vote-active", "true", { timeout: 5000 });
  });

  test("browser downvote flow: click, pick reason, verify score and highlight", async ({
    page,
    context,
    request,
  }) => {
    await authenticateContext(context);

    // Use API to get the expected score after downvote
    const voteRes = await request.post(
      `${BASE_URL}/api/comments/${COMMENT_ID}/vote`,
      {
        headers: { Cookie: authCookie, "Content-Type": "application/json" },
        data: { direction: "down", reason: "off_topic" },
      }
    );
    const expectedScore = (await voteRes.json()).breakdown.totalScore;

    // Remove it so browser test can do it fresh
    await request.delete(`${BASE_URL}/api/comments/${COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie },
    });

    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${COMMENT_ID}`);

    const comment = page.locator(`#comment-${COMMENT_ID}`);
    const downButton = comment.locator(
      'button[data-vote-direction="down"]'
    );
    await downButton.click();

    await expect(page.getByText("Why downvote?")).toBeVisible();
    await page.getByText("Off Topic").click();

    // Wait for update and verify score matches API
    const scoreDisplay = comment.locator(".tabular-nums");
    await expect(scoreDisplay).toHaveText(String(expectedScore), { timeout: 5000 });

    // Downvote button should be red
    await expect(downButton).toHaveAttribute("data-vote-active", "true", { timeout: 3000 });

    // Reload and verify persistence
    await page.reload();
    await page.waitForSelector(`#comment-${COMMENT_ID}`);
    const scoreAfterReload = await page
      .locator(`#comment-${COMMENT_ID}`)
      .locator(".tabular-nums")
      .textContent();
    expect(scoreAfterReload).toBe(String(expectedScore));

    const downButtonReloaded = page
      .locator(`#comment-${COMMENT_ID}`)
      .locator('button[data-vote-direction="down"]');
    await expect(downButtonReloaded).toHaveAttribute("data-vote-active", "true", { timeout: 5000 });
  });

  test("browser toggle off: click active upvote removes it, score reverts", async ({
    page,
    context,
    request,
  }) => {
    await authenticateContext(context);

    // Use a high-multiplier reason so the score change is visible after rounding
    // changed_my_mind = 3x * 0.5 weight = 1.5 contribution (always visible)
    const voteRes = await request.post(`${BASE_URL}/api/comments/${COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie, "Content-Type": "application/json" },
      data: { direction: "up", reason: "changed_my_mind" },
    });
    const scoreWithVoteExpected = (await voteRes.json()).breakdown.totalScore;

    // Get the score without vote
    const delRes = await request.delete(`${BASE_URL}/api/comments/${COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie },
    });
    const scoreWithoutExpected = (await delRes.json()).breakdown.totalScore;

    // Re-place the vote for the browser test
    await request.post(`${BASE_URL}/api/comments/${COMMENT_ID}/vote`, {
      headers: { Cookie: authCookie, "Content-Type": "application/json" },
      data: { direction: "up", reason: "changed_my_mind" },
    });

    await page.goto(`/d/${DEBATE_SLUG}`);
    await page.waitForSelector(`#comment-${COMMENT_ID}`);

    const comment = page.locator(`#comment-${COMMENT_ID}`);
    const scoreDisplay = comment.locator(".tabular-nums");
    const upButton = comment.locator(
      'button[data-vote-direction="up"]'
    );

    // Wait for vote state to load
    await expect(upButton).toHaveAttribute("data-vote-active", "true", { timeout: 5000 });
    await expect(scoreDisplay).toHaveText(String(scoreWithVoteExpected), { timeout: 5000 });

    // Click to remove
    await upButton.click();
    await page.waitForTimeout(500);

    // Score should revert to baseline
    await expect(scoreDisplay).toHaveText(String(scoreWithoutExpected), { timeout: 5000 });
    await expect(upButton).not.toHaveAttribute("data-vote-active", "true", { timeout: 3000 });
  });
});
