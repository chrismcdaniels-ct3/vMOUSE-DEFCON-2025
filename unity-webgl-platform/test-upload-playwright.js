const { chromium } = require('playwright');

async function testUpload() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    // Set viewport
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser console error:', msg.text());
    }
  });
  
  // Log network failures
  page.on('requestfailed', request => {
    console.log('Request failed:', request.url(), request.failure());
  });

  try {
    console.log('1. Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    
    // Check if redirected to login
    if (page.url().includes('/auth/login')) {
      console.log('2. Logging in...');
      await page.fill('input[type="email"]', 'chris.mcdaniels@ctcubed.com');
      await page.fill('input[type="password"]', 'Superman!2Superman!2');
      await page.click('button[type="submit"]');
      
      // Wait for navigation to dashboard
      await page.waitForURL('**/dashboard', { timeout: 30000 });
      console.log('✓ Logged in successfully');
    }
    
    console.log('3. Opening upload modal...');
    await page.click('button:has-text("Add Game")');
    await page.waitForSelector('text=Upload Unity WebGL Game', { timeout: 5000 });
    
    console.log('4. Filling game details...');
    await page.fill('input[placeholder="My Awesome Game"]', 'vMouse Game');
    await page.fill('input[placeholder="my-awesome-game"]', 'vmouse');
    
    console.log('5. Checking current auth state...');
    // Execute code in browser context to check auth
    const authState = await page.evaluate(async () => {
      try {
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession();
        return {
          hasTokens: !!session.tokens,
          identityId: session.identityId,
          credentials: !!session.credentials,
          userSub: session.userSub
        };
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('Auth state:', authState);
    
    console.log('6. Checking Amplify configuration...');
    const amplifyConfig = await page.evaluate(async () => {
      try {
        const { Amplify } = await import('aws-amplify');
        const config = Amplify.getConfig();
        return {
          hasStorage: !!config.Storage,
          storageRegion: config.Storage?.S3?.region,
          storageBucket: config.Storage?.S3?.bucket
        };
      } catch (err) {
        return { error: err.message };
      }
    });
    console.log('Amplify config:', amplifyConfig);
    
    console.log('7. Testing S3 upload directly...');
    const uploadTest = await page.evaluate(async () => {
      try {
        const { uploadData } = await import('aws-amplify/storage');
        const testData = new Blob(['test'], { type: 'text/plain' });
        
        const result = await uploadData({
          path: 'unity-builds/test/test.txt',
          data: testData
        }).result;
        
        return { success: true, key: result.path };
      } catch (err) {
        return { 
          error: err.message,
          errorName: err.name,
          errorStack: err.stack
        };
      }
    });
    console.log('Upload test result:', uploadTest);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'upload-test-debug.png' });
    
    console.log('\n=== Test Summary ===');
    console.log('Auth working:', !!authState.hasTokens);
    console.log('Storage configured:', !!amplifyConfig.hasStorage);
    console.log('Upload error:', uploadTest.error || 'None');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testUpload().catch(console.error);