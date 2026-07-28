import { test, expect } from "@playwright/test";
import { loginAsManager } from "./helpers";

test("manager can create a property and bulk-create units", async ({ page }) => {
  await loginAsManager(page);

  const propertyName = `Test Property ${Date.now()}`;
  await page.goto("/app/properties/new");
  await page.fill('input[name="name"]', propertyName);
  await page.selectOption('select[name="county"]', "Nairobi");
  await page.fill('input[name="town"]', "Test Town");
  await page.fill('input[name="address"]', "123 Test Road");
  await page.selectOption('select[name="type"]', "APARTMENT");
  await page.click('button[type="submit"]');
  await page.waitForURL("/app/properties");
  await expect(page.getByText(propertyName)).toBeVisible();

  await page.getByRole("link", { name: new RegExp(propertyName) }).click();
  await page.waitForURL(/\/app\/properties\/[^/]+$/);

  await page.getByRole("link", { name: "Add units" }).click();
  await page.waitForURL(/\/units\/new$/);

  const bulkForm = page.locator("form").nth(1);
  await bulkForm.locator('input[name="prefix"]').fill("A");
  await bulkForm.locator('input[name="startNumber"]').fill("1");
  await bulkForm.locator('input[name="endNumber"]').fill("3");
  await bulkForm.locator('input[name="unitType"]').fill("Bedsitter");
  await bulkForm.locator('input[name="bedrooms"]').fill("0");
  await bulkForm.locator('input[name="rentKES"]').fill("8000");
  await bulkForm.locator('input[name="depositKES"]').fill("8000");
  await bulkForm.getByRole("button", { name: "Create units" }).click();

  await page.waitForURL(/\/app\/properties\/[^/]+$/);
  await expect(page.getByRole("link", { name: /^A1/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^A2/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^A3/ })).toBeVisible();
});
