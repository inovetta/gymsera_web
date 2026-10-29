import { test, expect } from '@playwright/test';

// Phase 7 P6: the gym list shows "New" for a gym without approved reviews, the real count
// otherwise, and the price in the listing's currency (BUG-27, NEW-145). The API is mocked.
const gyms = [
  { id: 'b1', tenantId: 't1', title: 'heist', status: 'ACTIVE', genderType: 'MIXED', averageRating: 0, reviewCount: 0, minPrice: 2500, currency: 'PKR', cityId: 9 },
  { id: 'b2', tenantId: 't2', title: 'king · iron', status: 'ACTIVE', genderType: 'MIXED', averageRating: 4.5, reviewCount: 3, minPrice: 40, currency: 'USD', cityId: 9 },
];

test('gym list: "New", the real review count and the listing currency', async ({ page }) => {
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path.endsWith('/discovery/gyms')) data = { gyms, pagination: { total: 2, page: 1, limit: 12, totalPages: 1 } };
    else if (path.endsWith('/discovery/cities')) data = { cities: [{ id: 9, name: 'Newtown', gymCount: 2 }] };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'ok', data }) });
  });

  await page.goto('/gyms');
  const heist = page.locator('a[href="/gyms/b1"]');
  const king = page.locator('a[href="/gyms/b2"]');
  await expect(heist.getByText('New')).toBeVisible();
  await expect(heist.getByText('0.0')).toHaveCount(0);
  await expect(king.getByText('(3)')).toBeVisible();
  await expect(king.getByText(/US\$\s?40|USD\s?40/)).toBeVisible();
  await expect(page.getByText('(124)')).toHaveCount(0);
});
