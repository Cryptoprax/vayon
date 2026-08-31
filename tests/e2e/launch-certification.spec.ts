import { expect, test } from "@playwright/test";

const authenticatedRoutes = [
  "/vayon/dashboard", "/vayon/properties", "/vayon/leads", "/vayon/crm/contacts",
  "/vayon/crm/companies", "/vayon/deals", "/vayon/tasks", "/vayon/calendar",
  "/vayon/creative", "/vayon/ai/workforce", "/vayon/ai/work-queue",
  "/vayon/approvals", "/vayon/notifications", "/vayon/settings",
] as const;

test("public authentication entry points render without application errors", async ({ page }) => {
  for (const route of ["/login", "/signup", "/forgot-password"]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(400);
    await expect(page.locator("body")).not.toContainText(/NEXT_REDIRECT|Application Error|Unhandled Exception/);
  }
});

test("legacy routes normalize to canonical destinations", async ({ page }) => {
  const cases = [["/vayon/home?source=bookmark", "/vayon/dashboard?source=bookmark"], ["/vayon/workforce", "/vayon/ai/workforce"], ["/vayon/crm/leads", "/vayon/leads"], ["/vayon/creative-studio", "/vayon/creative"]] as const;
  for (const [legacy, canonical] of cases) {
    await page.goto(legacy);
    expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(canonical);
  }
});

test.describe("authenticated role certification", () => {
  const state = process.env.PLAYWRIGHT_AUTH_STATE;
  test.skip(!state, "Set PLAYWRIGHT_AUTH_STATE to a non-production QA storage-state file.");
  test.use({ storageState: state });

  for (const route of authenticatedRoutes) test(`${route} loads without fatal UI`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).not.toContainText(/404|NEXT_REDIRECT|Workspace view could not load|Unhandled Exception/);
  });

  test("logout terminates the authenticated journey", async ({ page }) => {
    await page.goto("/vayon/dashboard");
    const logout = page.getByRole("button", { name: /log out|sign out/i }).or(page.getByRole("link", { name: /log out|sign out/i }));
    await expect(logout).toBeVisible();
  });
});
