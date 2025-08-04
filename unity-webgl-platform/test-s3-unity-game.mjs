import { chromium } from 'playwright';

async function testUnityGameFromS3() {
  const browser = await chromium.launch({ 
    headless: true,
    devtools: false 
  });
  
  const context = await browser.newContext({
    // Set viewport to ensure Unity canvas fits
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Browser error:`, msg.text());
    } else if (msg.text().includes('Unity')) {
      console.log(`🎮 Unity log [${msg.type()}]:`, msg.text());
    }
  });

  // Monitor network requests to S3
  page.on('request', request => {
    if (request.url().includes('amplify') && request.url().includes('.s3.')) {
      console.log('📥 S3 Request:', request.method(), request.url().split('?')[0]);
    }
  });

  page.on('response', response => {
    if (response.url().includes('amplify') && response.url().includes('.s3.')) {
      console.log('📤 S3 Response:', response.status(), response.url().split('?')[0]);
    }
  });

  try {
    console.log('🔐 Logging in first...');
    
    // Login as admin first
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'chris.mcdaniels@ctcubed.com');
    await page.fill('input[type="password"]', process.env.ADMIN_PASSWORD || 'YourNewPasswordHere');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and redirect
    await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {
      console.log('No navigation after login, checking current URL...');
    });
    
    console.log('Current URL after login:', page.url());
    
    // Now load the Unity game page
    console.log('🌐 Loading Unity game page...');
    await page.goto('http://localhost:3000/unity/vmouse', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Check for game loading indicators
    console.log('\n🔍 Checking page state...');
    
    // Check for error messages
    const errorText = await page.locator('text=Failed to load game').count();
    const notFoundText = await page.locator('text=Game not found').count();
    const configError = await page.locator('text=Game configuration not found').count();
    
    if (errorText > 0 || notFoundText > 0 || configError > 0) {
      console.log('❌ Game failed to load - error displayed on page');
      const errorMessage = await page.locator('.text-center').textContent();
      console.log('Error message:', errorMessage);
    } else {
      // Wait for Unity canvas
      console.log('⏳ Waiting for Unity canvas...');
      
      try {
        await page.waitForSelector('#unity-canvas', { 
          state: 'visible',
          timeout: 20000 
        });
        console.log('✅ Unity canvas found!');
        
        // Check if Unity is actually loaded
        const canvasVisible = await page.isVisible('#unity-canvas');
        console.log('Canvas visible:', canvasVisible);
        
        // Check canvas dimensions
        const canvasDimensions = await page.evaluate(() => {
          const canvas = document.querySelector('#unity-canvas');
          if (canvas) {
            return {
              width: canvas.offsetWidth,
              height: canvas.offsetHeight,
              style: canvas.style.cssText
            };
          }
          return null;
        });
        console.log('Canvas dimensions:', canvasDimensions);
        
        // Wait for Unity to fully load
        await page.waitForTimeout(5000);
        
        // Take a screenshot
        await page.screenshot({ 
          path: 'unity-s3-loaded.png', 
          fullPage: true 
        });
        console.log('📸 Screenshot saved as unity-s3-loaded.png');
        
        // Check for Unity loading progress
        const progressText = await page.locator('text=Loading Unity application').count();
        if (progressText > 0) {
          console.log('⏳ Unity is still loading...');
          
          // Wait for loading to complete
          await page.waitForSelector('text=Loading Unity application', {
            state: 'hidden',
            timeout: 30000
          }).catch(() => {
            console.log('⚠️  Unity loading took too long');
          });
        }
        
        console.log('\n✅ Unity game loaded successfully from S3!');
        
      } catch (error) {
        console.log('❌ Unity canvas not found or not visible');
        
        // Take a screenshot of the error state
        await page.screenshot({ 
          path: 'unity-s3-error.png', 
          fullPage: true 
        });
        console.log('📸 Error screenshot saved as unity-s3-error.png');
      }
    }
    
    // Get all network requests to S3
    const s3Requests = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('.s3.') || entry.name.includes('amplify'))
        .map(entry => ({
          url: entry.name.split('?')[0],
          duration: Math.round(entry.duration),
          size: entry.transferSize,
          status: entry.responseStatus
        }));
    });
    
    console.log('\n📊 S3 Resource Loading Summary:');
    s3Requests.forEach(req => {
      console.log(`- ${req.url.split('/').pop()}: ${req.duration}ms, ${req.size} bytes`);
    });

  } catch (error) {
    console.error('❌ Test error:', error.message);
    
    // Take error screenshot
    await page.screenshot({ 
      path: 'unity-s3-test-error.png', 
      fullPage: true 
    });
    console.log('📸 Error screenshot saved as unity-s3-test-error.png');
    
  } finally {
    await browser.close();
  }
}

// Run the test
console.log('🚀 Starting Unity S3 game test...\n');
testUnityGameFromS3()
  .then(() => {
    console.log('\n✅ Test completed!');
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });