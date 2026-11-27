import { test, expect } from '@playwright/test';

// Phase 7 P6: the gym list shows "New" for a branch without approved reviews, the real count
// otherwise, and the price in the branch's currency (BUG-27, NEW-145). The API is mocked with the
// contract v2 shapes (R-120): GET /discovery/branches → { branches: [BranchCard] }, pagination at the
// top level as the API sends it; a card links to /gyms/<businessId>/branches/<branchId>; the verified
// check shows only when businessVerified (D11).
const branches = [
  {
    id: 'br1', branchId: 'br1', businessId: 'b1', organizationId: 'o1',
    displayName: 'heist', businessName: 'heist', branchName: 'heist', businessVerified: false,
    business: { name: 'heist', businessVerified: false },
    status: 'ACTIVE', genderType: 'MIXED', averageRating: '0.00', reviewCount: 0, minPrice: 2500, currency: 'PKR', cityId: 9,
  },
  {
    id: 'br2', branchId: 'br2', businessId: 'b2', organizationId: 'o2',
    displayName: 'king · iron', businessName: 'king', branchName: 'iron', businessVerified: true,
    business: { name: 'king', businessVerified: true },
    status: 'ACTIVE', genderType: 'MIXED', averageRating: '4.50', reviewCount: 3, minPrice: 40, currency: 'USD', cityId: 9,
  },
];

test('gym list: "New", the real review count, the branch currency and the verified check', async ({ page }) => {
  await page.route('**/api/v1/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: Record<string, unknown> = { success: true, message: 'ok', data: {} };
    if (path.endsWith('/discovery/branches')) {
      body = { success: true, message: 'OK', data: { branches }, pagination: { total: 2, page: 1, limit: 12, totalPages: 1 } };
    } else if (path.endsWith('/discovery/cities')) {
      body = { success: true, message: 'ok', data: { cities: [{ id: 9, name: 'Newtown', branchCount: 2 }] } };
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto('/gyms');
  const heist = page.locator('a[href="/gyms/b1/branches/br1"]');
  const king = page.locator('a[href="/gyms/b2/branches/br2"]');
  await expect(heist.getByText('New')).toBeVisible();
  await expect(heist.getByText('0.0')).toHaveCount(0);
  await expect(king.getByText('(3)')).toBeVisible();
  await expect(king.getByText(/US\$\s?40|USD\s?40/)).toBeVisible();
  await expect(page.getByText('(124)')).toHaveCount(0);
  // D11: the check beside a verified business only.
  await expect(king.getByTestId('verified-check')).toBeVisible();
  await expect(heist.getByTestId('verified-check')).toHaveCount(0);
});
