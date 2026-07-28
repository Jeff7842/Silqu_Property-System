import { test, expect } from "@playwright/test";
import { loginAsManager } from "./helpers";

test("caretaker sees only assigned units; a direct URL to another returns 403", async ({ page }) => {
  // Find a unit on a property the seeded caretaker is NOT assigned to (Buruburu Courts).
  await loginAsManager(page);
  await page.goto("/app/properties");
  await page.getByRole("link", { name: /Buruburu Courts/ }).click();
  await page.waitForURL(/\/app\/properties\/[^/]+$/);
  await page.locator('a[href*="/units/"]:not([href$="/units/new"])').first().click();
  await page.waitForURL(/\/app\/properties\/[^/]+\/units\/[^/]+$/);
  const unassignedUnitUrl = page.url();

  // Log in as the caretaker (seeded, assigned only to Kileleshwa Gardens).
  await page.context().clearCookies();
  await loginAsManager(page, "caretaker@kemboproperties.co.ke");

  await page.goto("/app/properties");
  await expect(page.getByText("Kileleshwa Gardens")).toBeVisible();
  await expect(page.getByText("Buruburu Courts")).toHaveCount(0);

  const response = await page.goto(unassignedUnitUrl);
  expect(response?.status()).toBe(403);
});
