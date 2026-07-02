import { test, expect } from '@playwright/test';
import { installApiMocks, seedAuth } from './helpers';

test.describe('Navigation & layout', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await installApiMocks(page);
  });

  test('root redirects to the dashboard when authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Partner Organizations')).toBeVisible();
  });

  test('sidebar navigates between sections', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByRole('button', { name: 'Users' }).click();
    await expect(page).toHaveURL(/\/users$/);
    // "Add User" is unique to the Users screen — proves the page rendered.
    await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();

    await page.getByRole('button', { name: 'Partners' }).click();
    await expect(page).toHaveURL(/\/partners$/);
  });

  test('account menu can log the admin out', async ({ page }) => {
    await page.goto('/dashboard');

    // Open the avatar menu in the app bar, then Logout.
    await page.locator('header').getByRole('button').last().click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeNull();
  });
});
