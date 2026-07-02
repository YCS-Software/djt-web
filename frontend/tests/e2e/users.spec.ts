import { test, expect } from '@playwright/test';
import { installApiMocks, seedAuth } from './helpers';

test.describe('Users CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await installApiMocks(page);
    await page.goto('/users');
  });

  test('lists seeded users', async ({ page }) => {
    await expect(page.getByText('Back-office administrators and partner users')).toBeVisible();
    await expect(page.getByText('Ada Lovelace')).toBeVisible();
    await expect(page.getByText('Alan Turing')).toBeVisible();
  });

  test('creates a user via the Add User dialog', async ({ page }) => {
    await page.getByRole('button', { name: 'Add User' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Add User')).toBeVisible();

    await dialog.getByLabel('Name *').fill('Grace Hopper');
    await dialog.getByLabel('Email *').fill('grace@djt.com');
    await dialog.getByLabel('Password *').fill('secret123');
    await dialog.getByRole('button', { name: 'Create' }).click();

    // Success toast, and the re-fetched list now includes the new user.
    await expect(page.getByText('User created')).toBeVisible();
    await expect(page.getByText('Grace Hopper')).toBeVisible();
  });

  test('validates required fields before submitting', async ({ page }) => {
    await page.getByRole('button', { name: 'Add User' }).click();
    const dialog = page.getByRole('dialog');

    await dialog.getByRole('button', { name: 'Create' }).click();

    // Required-field errors appear and the dialog stays open.
    await expect(dialog.getByText('Required').first()).toBeVisible();
    await expect(dialog).toBeVisible();
  });
});
