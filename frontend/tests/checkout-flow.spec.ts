import { test, expect } from "@playwright/test";

test.describe("Comptoir — browse to checkout", () => {
  test("a new user can register, add an item to cart, and reach Stripe checkout", async ({
    page,
  }) => {
    const uniqueEmail = `e2e-test-${Date.now()}@example.com`;

    // 1. Register a fresh account
    await page.goto("/register");
    await page.locator('input[type="text"]').fill("E2E Test User");
    await page.locator('input[type="email"]').fill(uniqueEmail);
    await page.locator('input[type="password"]').nth(0).fill("testpassword123");
    await page.locator('input[type="password"]').nth(1).fill("testpassword123");
    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(page).toHaveURL("/");

    // 2. Browse the menu — confirm at least one item card with an Add button is visible
    const addButton = page.getByRole("button", { name: "Add" }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });

    // 3. Add the first available item to the cart
    await addButton.click();

    // 4. Go to the cart via the header (client-side nav — preserves in-memory cart state)
    await page.getByRole("button", { name: /^cart/i }).first().click();
    await expect(page).toHaveURL("/cart");

    // Confirm the cart page shows at least one item row (not the empty-cart state)
    await expect(page.getByText("Your cart is empty.")).not.toBeVisible();
    await expect(page.getByRole("button", { name: /checkout/i })).toBeVisible();

    // 5. Click checkout and confirm it redirects to Stripe's hosted checkout page
    // 5. Click checkout and confirm it redirects to Stripe's hosted checkout page
    await page.getByRole("button", { name: /checkout/i }).click();
    await page.waitForURL(/checkout\.stripe\.com/, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    expect(page.url()).toContain("checkout.stripe.com");
  });
});
