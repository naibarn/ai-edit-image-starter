import { test, expect } from '@playwright/test';

test.describe('AI Image Studio - Tailwind CSS Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main page and redirect to /edit', async ({ page }) => {
    // Should redirect to /edit
    await expect(page).toHaveURL(/\/edit$/);
  });

  test('should have proper Tailwind CSS styling', async ({ page }) => {
    // Check main container has background
    const main = page.locator('main');
    await expect(main).toHaveClass(/space-y-8/);

    // Check header section styling
    const header = page.locator('main > div').first();
    await expect(header).toHaveClass(/rounded-2xl/);
    await expect(header).toHaveClass(/bg-gradient-to-br/);

    // Check header title
    const title = page.locator('h1');
    await expect(title).toHaveText('AI Image Studio');
    await expect(title).toHaveClass(/text-3xl/);
    await expect(title).toHaveClass(/font-semibold/);

    // Check main card styling
    const card = page.locator('.border.bg-card');
    await expect(card).toHaveClass(/shadow-sm/);
    await expect(card).toHaveClass(/rounded-2xl/);

    // Check form inputs have proper styling
    const fileInputs = page.locator('input[type="file"]');
    await expect(fileInputs.first()).toHaveClass(/border/);
    await expect(fileInputs.first()).toHaveClass(/rounded-md/);

    // Check buttons have primary styling
    const submitButton = page.locator('button').filter({ hasText: 'Generate / Edit' });
    await expect(submitButton).toHaveClass(/bg-primary/);
    await expect(submitButton).toHaveClass(/text-primary-foreground/);

    // Check textarea styling
    const textarea = page.locator('textarea');
    await expect(textarea).toHaveClass(/border/);
    await expect(textarea).toHaveClass(/rounded-md/);
  });

  test('should have responsive grid layout', async ({ page }) => {
    // Check main grid container
    const gridContainer = page.locator('section.grid');
    await expect(gridContainer).toHaveClass(/grid-cols-1/);
    await expect(gridContainer).toHaveClass(/md:grid-cols-2/);
    await expect(gridContainer).toHaveClass(/lg:grid-cols-3/);
  });

  test('should have proper meta tags and viewport', async ({ page }) => {
    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', 'width=device-width, initial-scale=1');

    // Check html lang attribute
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
  });

  test('should verify Tailwind CSS is working - core functionality', async ({ page }) => {
    // Verify that Tailwind CSS classes are being applied correctly
    const body = page.locator('body');
    await expect(body).toHaveClass(/bg-background/);
    await expect(body).toHaveClass(/text-foreground/);
    await expect(body).toHaveClass(/antialiased/);

    // Check that the main layout has proper spacing
    const main = page.locator('main');
    await expect(main).toHaveClass(/space-y-8/);

    // Verify form elements have Tailwind styling
    const inputs = page.locator('input, textarea, button');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);

    // Check that at least one input has border styling
    const borderedElements = page.locator('.border');
    const borderCount = await borderedElements.count();
    expect(borderCount).toBeGreaterThan(0);
  });
});