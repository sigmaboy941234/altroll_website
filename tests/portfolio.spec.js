import { test, expect } from '@playwright/test';

test.describe('ALTROLL Portfolio', () => {
  
  test('should load without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // Wait for Three.js to initialize
    await page.waitForTimeout(2000);
    
    // Check for errors
    expect(errors).toHaveLength(0);
  });

  test('should display entry screen', async ({ page }) => {
    await page.goto('/');
    
    // Check entry screen is visible
    const entryScreen = page.locator('#entry-screen');
    await expect(entryScreen).toBeVisible();
    
    // Check typewriter text is present
    const entryText = page.locator('.entry-text');
    await expect(entryText).toBeVisible();
  });

  test('should render Three.js canvas', async ({ page }) => {
    await page.goto('/');
    
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify canvas has proper dimensions
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('should dismiss entry screen on click', async ({ page }) => {
    await page.goto('/');
    
    const entryScreen = page.locator('#entry-screen');
    await expect(entryScreen).toBeVisible();
    
    // Click entry screen
    await entryScreen.click();
    
    // Wait for fade animation
    await page.waitForTimeout(1000);
    
    // Entry screen should be hidden
    await expect(entryScreen).toHaveCSS('opacity', '0');
  });

  test('should show main content after entry screen', async ({ page }) => {
    await page.goto('/');
    
    // Click entry screen
    await page.locator('#entry-screen').click();
    
    // Wait for typewriter animations to complete (~4-5 seconds)
    await page.waitForTimeout(5000);
    
    // Check main content sections are visible
    await expect(page.locator('.profile')).toBeVisible();
    await expect(page.locator('.social-icons')).toBeVisible();
    await expect(page.locator('.links')).toBeVisible();
  });

  test('should display toggle button after entry screen', async ({ page }) => {
    await page.goto('/');
    
    // Initially button should not be visible
    const toggleBtn = page.locator('#toggle-ui-btn');
    
    // Click entry screen
    await page.locator('#entry-screen').click();
    
    // Wait for button to appear (820ms delay)
    await page.waitForTimeout(1000);
    
    // Button should now be visible
    await expect(toggleBtn).toBeVisible();
  });

  test('should toggle UI visibility', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss entry screen
    await page.locator('#entry-screen').click();
    await page.waitForTimeout(1500);
    
    const toggleBtn = page.locator('#toggle-ui-btn');
    const mainContent = page.locator('.main-content');
    
    // Click toggle button to hide
    await toggleBtn.click();
    await expect(mainContent).toHaveClass(/hidden/);
    
    // Click again to show
    await toggleBtn.click();
    await expect(mainContent).not.toHaveClass(/hidden/);
  });

  test('should have working social links', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss entry screen
    await page.locator('#entry-screen').click();
    
    // Wait for social icons to animate in (~3.5s delay + stagger)
    await page.waitForTimeout(5000);
    
    // Check all social icons are present and have hrefs
    const socialIcons = page.locator('.social-icon');
    const count = await socialIcons.count();
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < count; i++) {
      const href = await socialIcons.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href.length).toBeGreaterThan(0);
    }
  });

  test('should display profile information', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss entry screen
    await page.locator('#entry-screen').click();
    
    // Wait for typewriter to complete profile section
    await page.waitForTimeout(3000);
    
    // Check profile content
    const profileName = page.locator('.profile h1');
    await expect(profileName).toBeVisible();
    
    const profileBio = page.locator('.bio-line-1');
    await expect(profileBio).toBeVisible();
  });

  test('should animate typewriter effect', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss entry screen
    await page.locator('#entry-screen').click();
    
    const profileName = page.locator('.profile h1');
    
    // Wait for typewriter to start and be in progress
    await page.waitForTimeout(1000);
    
    // Check for typewriter cursor (should be present during animation)
    const hasCursor = await page.locator('.tw-cursor').count();
    expect(hasCursor).toBeGreaterThan(0);
  });

  test('should display footer with current year', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss entry screen
    await page.locator('#entry-screen').click();
    await page.waitForTimeout(7000); // Footer appears after 6000ms
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    const currentYear = new Date().getFullYear();
    await expect(footer).toContainText(currentYear.toString());
  });

  test('should take screenshot of full page', async ({ page }) => {
    await page.goto('/');
    
    // Dismiss entry screen
    await page.locator('#entry-screen').click();
    
    // Wait for ALL animations to complete (footer is at 6000ms + fade time)
    await page.waitForTimeout(8000);
    
    // Take screenshot for visual inspection
    await page.screenshot({ 
      path: 'test-results/portfolio-full.png',
      fullPage: true 
    });
  });

  test('should handle reduced motion preference', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/');
    
    // Dismiss entry screen
    await page.locator('#entry-screen').click();
    
    // Even with reduced motion, wait a bit for instant typing to complete
    await page.waitForTimeout(2000);
    
    // Content should still be visible
    await expect(page.locator('.profile')).toBeVisible();
  });
});
