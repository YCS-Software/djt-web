import { test, expect } from '@playwright/test';
import { installApiMocks, VALID_EMAIL, VALID_PASSWORD } from './helpers';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await installApiMocks(page);
  });

  test('unauthenticated visit to a protected route redirects to /login', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('shows client-side validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    // Still on the login page — no navigation attempted.
    await expect(page).toHaveURL(/\/login$/);
  });

  test('shows a server error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('wrong@djt.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('alert')).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logs in with valid credentials and lands on the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(VALID_EMAIL);
    await page.getByLabel('Password').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    // A KPI label unique to the dashboard confirms the page actually rendered.
    await expect(page.getByText('Partner Organizations')).toBeVisible();
    // Tokens were persisted for subsequent authenticated requests.
    expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeTruthy();
  });
});
