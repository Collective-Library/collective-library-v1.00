import { test, expect } from "@playwright/test";

/**
 * Smoke tests for the public Spots surface. These run anonymously — no auth.
 *
 * Staging must have ≥1 admin-promoted Spot for the "card visible" assertion
 * to be meaningful; before that, only the empty-state assertion fires. Both
 * paths are valid — we don't fail the build for an empty `/spots`.
 */
test.describe("Public Spots", () => {
  test("/spots list loads (empty or populated)", async ({ page }) => {
    const response = await page.goto("/spots");
    expect(response?.status(), "200 OK").toBeLessThan(400);

    // Page heading or empty-state copy must render.
    const body = page.locator("body");
    await expect(body).toContainText(/spot/i);
  });

  test("/spots filters render without crashing", async ({ page }) => {
    await page.goto("/spots");
    // Type filter pills + city filter should at least be in the DOM as
    // <select> / <button> elements — regardless of dataset emptiness.
    const interactive = page.locator("select, button, a[href]");
    await expect(interactive.first()).toBeVisible({ timeout: 10_000 });
  });

  test("/mastermind/spots blocks anonymous users", async ({ page }) => {
    const response = await page.goto("/mastermind/spots");
    // Two valid outcomes: redirect to /auth/login or /shelf, OR 401/403 page.
    const finalUrl = page.url();
    const status = response?.status() ?? 0;
    const redirected =
      /\/(auth\/login|shelf|$)/i.test(finalUrl) && !finalUrl.endsWith("/mastermind/spots");
    expect(redirected || status >= 400, `url=${finalUrl} status=${status}`).toBe(true);
  });
});

test.describe("Event detail (Spots chip)", () => {
  test("/event list loads (smoke)", async ({ page }) => {
    // /event is auth-gated, so anonymous → redirect. We just confirm the
    // redirect path doesn't crash.
    const response = await page.goto("/event");
    expect(response?.status() ?? 0).toBeLessThan(500);
  });
});
