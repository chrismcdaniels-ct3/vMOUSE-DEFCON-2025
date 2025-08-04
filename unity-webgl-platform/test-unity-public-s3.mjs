import { chromium } from 'playwright';

async function testUnityPublicS3() {
  const browser = await chromium.launch({ 
    headless: true,
    devtools: false 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();

  // Enable all console logging
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Monitor errors
  page.on('pageerror', error => {
    console.log('❌ Page error:', error.message);
  });

  // Monitor network requests
  page.on('requestfailed', request => {
    console.log('❌ Request failed:', request.url(), request.failure().errorText);
  });

  console.log('🚀 Testing Unity game public access at /unity/vmouse...\n');

  try {
    // Go directly to the Unity game page (no login)
    console.log('📱 Loading http://localhost:3000/unity/vmouse');
    await page.goto('http://localhost:3000/unity/vmouse', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for page to settle
    await page.waitForTimeout(3000);

    // Check what's on the page
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // Check for any error messages
    const errorMessages = await page.evaluate(() => {
      const errors = [];
      
      // Look for common error text
      const errorSelectors = [
        'text=Failed to load',
        'text=Error',
        'text=not found',
        'text=not authorized',
        'text=configuration not found'
      ];
      
      errorSelectors.forEach(selector => {
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          if (el.textContent && el.textContent.toLowerCase().includes(selector.replace('text=', '').toLowerCase())) {
            errors.push(el.textContent.trim());
          }
        });
      });
      
      return [...new Set(errors)]; // Remove duplicates
    });

    if (errorMessages.length > 0) {
      console.log('\n❌ Error messages found on page:');
      errorMessages.forEach(msg => console.log('  -', msg));
    }

    // Check if Unity canvas exists
    const canvasExists = await page.locator('#unity-canvas').count();
    console.log('\nUnity canvas found:', canvasExists > 0);

    // Check for loading indicators
    const loadingText = await page.locator('text=Loading').count();
    console.log('Loading indicators:', loadingText);

    // Get the full page text
    const pageText = await page.textContent('body');
    console.log('\n📄 Page content preview:');
    console.log(pageText.substring(0, 500) + '...');

    // Take screenshot
    await page.screenshot({ path: 'unity-public-s3-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved as unity-public-s3-debug.png');

    // Check network activity for S3 requests
    const s3Requests = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('s3') || entry.name.includes('amplify'))
        .map(entry => ({
          url: entry.name.split('?')[0],
          status: entry.responseStatus || 'unknown',
          duration: Math.round(entry.duration)
        }));
    });

    if (s3Requests.length > 0) {
      console.log('\n📊 S3 requests made:');
      s3Requests.forEach(req => {
        console.log(`  - ${req.url.split('/').slice(-2).join('/')}: ${req.status} (${req.duration}ms)`);
      });
    } else {
      console.log('\n⚠️  No S3 requests detected');
    }

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'unity-public-s3-error.png', fullPage: true });
    console.log('📸 Error screenshot saved');
  } finally {
    await browser.close();
  }
}

testUnityPublicS3();