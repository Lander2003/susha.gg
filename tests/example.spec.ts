import { test, expect } from '@playwright/test';


test('has title', async  ({ page }) => {
  
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/susha-gg/);
});

test('Search player is working', async  ({ page }) => {
  
  await page.goto('/');

  await page.getByPlaceholder('Example: Carnivore#beef').fill('hide on bush#kr1');
  await page.locator('select').selectOption('KR');
  await page.getByRole('button', { name: 'Search user', exact: true }).click();
  
  await expect(page.locator('.player-info')).toBeVisible();

  await expect(
    page.locator('.player-info').getByRole('heading', {
      name: /hide on bush/i,
    })
  ).toBeVisible();

  await expect(page.locator('.match-card').first()).toBeVisible();
});

test('Check if Leaderboard is working', async ({ page }) => {
  await page.goto('/leaderboard');

  await expect(page.getByRole('heading', { name: /EUW CHALLENGER/ })).toBeVisible();
})

