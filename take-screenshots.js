const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  
  // Wait for entry screen and click it
  await page.waitForTimeout(1000);
  await page.locator('#entry-screen').click();
  
  // Wait for animations
  await page.waitForTimeout(8000);
  
  // Screenshot 1: Main page with 4 buttons
  await page.screenshot({ path: 'screenshot-main-page.png', fullPage: true });
  console.log('✓ Saved screenshot-main-page.png');
  
  // Click on "My Contributions" button
  await page.locator('#contributions-button').click();
  
  // Wait for transition
  await page.waitForTimeout(2000);
  
  // Screenshot 2: Contributions page with 3 games
  await page.screenshot({ path: 'screenshot-contributions.png', fullPage: true });
  console.log('✓ Saved screenshot-contributions.png');
  
  await browser.close();
  console.log('✓ Done! Check the screenshots in the project folder.');
})();
