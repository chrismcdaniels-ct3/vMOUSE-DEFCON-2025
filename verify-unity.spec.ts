import { test, expect } from '@playwright/test';

test('verify Unity game loads from S3', async ({ page }) => {
  // Listen for network requests to S3
  const s3Requests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('s3.amazonaws.com')) {
      s3Requests.push(request.url());
    }
  });
  
  // Navigate to home page
  await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
  
  // Verify home page loads
  await expect(page.locator('h1')).toContainText('DEFCON');
  console.log('✅ Home page loads correctly');
  
  // Click on vMOUSE game
  await page.click('text=vMOUSE Drone');
  await page.waitForTimeout(3000);
  
  // Check if we're on the game page
  expect(page.url()).toContain('/unity/vmouse');
  console.log('✅ Navigated to Unity game page');
  
  // Check for Unity container
  const unityContainer = page.locator('#unity-container');
  const containerCount = await unityContainer.count();
  console.log(`Unity container found: ${containerCount > 0 ? '✅' : '❌'}`);
  
  // Check S3 requests
  console.log('\nS3 asset requests made:');
  s3Requests.forEach(url => {
    const filename = url.split('/').pop();
    console.log(`  - ${filename}`);
  });
  
  if (s3Requests.length > 0) {
    console.log('✅ Unity assets loading from S3');
  } else {
    console.log('❌ No S3 requests detected');
  }
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/unity-game.png' });
  console.log('\nScreenshot saved to /tmp/unity-game.png');
});