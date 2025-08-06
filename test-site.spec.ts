import { test, expect } from '@playwright/test';

test('check if site loads', async ({ page }) => {
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  // Navigate to the site
  console.log('Navigating to http://localhost:3002');
  const response = await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
  console.log('Response status:', response?.status());
  
  // Check title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for 404
  const bodyText = await page.textContent('body');
  if (bodyText.includes('404') || bodyText.includes('not found')) {
    console.log('ERROR: Page shows 404 or not found');
    console.log('Body text:', bodyText.substring(0, 500));
  }
  
  // Check for main content
  const hasHeading = await page.locator('h1').count();
  console.log('H1 elements found:', hasHeading);
  
  // Screenshot
  await page.screenshot({ path: '/tmp/site-screenshot.png' });
  console.log('Screenshot saved to /tmp/site-screenshot.png');
  
  // Try to click on game
  const gameLink = page.locator('text=vMOUSE Drone');
  if (await gameLink.count() > 0) {
    console.log('Found vMOUSE Drone link, clicking...');
    await gameLink.click();
    await page.waitForTimeout(2000);
    console.log('Game URL:', page.url());
  } else {
    console.log('ERROR: Could not find vMOUSE Drone link');
  }
});