import type { Page } from "@playwright/test";

export async function loginAsManager(page: Page, email = "manager@kemboproperties.co.ke") {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "Passw0rd!");
  await page.click('button[type="submit"]');
  await page.waitForURL("/app");
}
