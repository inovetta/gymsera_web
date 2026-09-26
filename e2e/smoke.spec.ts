import { test, expect } from '@playwright/test';

test.describe('Web smoke suite', () => {
  test('landing page loads properly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
