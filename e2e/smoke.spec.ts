import { test, expect } from '@playwright/test';

test.describe('Web smoke suite', () => {
  test('app starts and login page loads properly', async ({ page }) => {
    // Navigate to auth login page
    await page.goto('/auth/login');

    // Verify page headings and brand
    await expect(page.locator('h1, h2')).toContainText(['GymsEra', 'Welcome back']);
    await expect(page.getByText('Sign in to your account to continue')).toBeVisible();

    // Verify email and password form inputs
    const emailInput = page.locator('input#email, input[type="email"]');
    const passwordInput = page.locator('input#password, input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Verify submit button is rendered
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });
});
