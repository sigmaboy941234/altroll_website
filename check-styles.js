const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('file://' + __dirname + '/index.html');
  
  // Wait for entry screen
  await page.waitForTimeout(1000);
  await page.locator('#entry-screen').click();
  
  // Wait for animations
  await page.waitForTimeout(8000);
  
  // Check the computed styles
  const linksGap = await page.$eval('.links', el => {
    return window.getComputedStyle(el).gap;
  });
  
  const linkItems = await page.$$eval('.link-item', els => {
    return els.map(el => {
      const style = window.getComputedStyle(el);
      return {
        margin: style.margin,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        height: style.height
      };
    });
  });
  
  console.log('Links container gap:', linksGap);
  console.log('Link items styles:', JSON.stringify(linkItems, null, 2));
  
  await browser.close();
})();
