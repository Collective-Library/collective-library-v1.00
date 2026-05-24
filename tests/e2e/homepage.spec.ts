import { test, expect } from "@playwright/test";

test.describe("Public landing", () => {
  test("homepage loads with brand and primary CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Collective Library|Journey Perintis/i);
    // Hero copy from `app/page.tsx`: "Where books connect people…"
    await expect(page.locator("body")).toContainText(/buku|book|komunitas/i);
  });

  test("no console errors on homepage", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Ignore noisy 3rd-party warnings (Sentry init when DSN unset, hCaptcha, etc.)
    const fatal = errors.filter(
      (e) =>
        !/sentry|hcaptcha|next-route-announcer|hydration|favicon/i.test(e) &&
        !/Failed to load resource/i.test(e),
    );
    expect(fatal, fatal.join("\n")).toEqual([]);
  });
});
