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

  test('navigating to /onboarding redirects to /gym-owner/register', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/.*\/gym-owner\/register/);
    await expect(page.locator('h1, h2')).toContainText(['Create your account']);
  });

  test('/gymsera-billing shows thin Stripe return card and links to CMS billing (UX-02)', async ({ page }) => {
    await page.context().addCookies([{ name: 'gymsera_session', value: '1', url: 'http://localhost:3002' }]);
    await page.addInitScript(() => {
      localStorage.setItem('gymsera_access_token', 'e2e-placeholder');
      localStorage.setItem('gymsera_refresh_token', 'e2e-placeholder');
      localStorage.setItem(
        'gymsera_user',
        JSON.stringify({ id: 'user-member', fullName: 'Ali Khan', email: 'ali@example.test', role: 'MEMBER', status: 'ACTIVE' })
      );
    });
    await page.route('**/api/v1/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      let data: Record<string, unknown> = {};
      if (path.endsWith('/auth/me')) {
        data = { id: 'user-member', fullName: 'Ali Khan', email: 'ali@example.test', role: 'MEMBER', status: 'ACTIVE' };
      } else if (path.endsWith('/me/subscriptions')) {
        data = { memberships: [] };
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'ok', data }),
      });
    });

    await page.goto('/gymsera-billing');
    // P9 (NEW-180): with no checkout to confirm it says so, not that the host has no subscription.
    await expect(page.getByText('No payment to confirm')).toBeVisible();
    await expect(page.getByRole('link', { name: /cms billing/i })).toBeVisible();
  });
});
