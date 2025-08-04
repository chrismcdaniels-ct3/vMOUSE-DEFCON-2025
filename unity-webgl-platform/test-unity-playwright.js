const { chromium } = require('playwright');

(async () => {
  console.log('Starting Unity WebGL loading test with Playwright...');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('Page console:', msg.text()));
    page.on('pageerror', err => console.error('Page error:', err));
    
    // Test the local Unity player
    console.log('\n1. Testing local Unity player at /test-vmouse...');
    await page.goto('http://localhost:3000/test-vmouse', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for Unity canvas
    await page.waitForSelector('#unity-canvas', { timeout: 30000 });
    console.log('✓ Unity canvas found');
    
    // Check if Unity loader script is loaded
    const loaderScript = await page.locator('script[src*="defcon_vmouse.loader.js"]').count();
    if (loaderScript > 0) {
      console.log('✓ Unity loader script loaded');
    } else {
      console.log('✗ Unity loader script not found');
    }
    
    // Wait for createUnityInstance to be available
    const hasUnityInstance = await page.evaluate(() => {
      return window.createUnityInstance !== undefined;
    });
    
    if (hasUnityInstance) {
      console.log('✓ createUnityInstance function available');
    } else {
      console.log('✗ createUnityInstance function not available');
      
      // Check what scripts are actually loaded
      const scripts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('script')).map(s => s.src);
      });
      console.log('Scripts loaded:', scripts);
    }
    
    // Check for errors
    const errors = await page.locator('.text-red-500').count();
    if (errors === 0) {
      console.log('✓ No error messages displayed');
    } else {
      console.log(`✗ Found ${errors} error messages`);
      const errorText = await page.locator('.text-red-500').first().textContent();
      console.log('Error:', errorText);
    }
    
    // Check canvas dimensions
    const canvasBox = await page.locator('#unity-canvas').boundingBox();
    if (canvasBox && canvasBox.width > 0 && canvasBox.height > 0) {
      console.log(`✓ Canvas has dimensions: ${canvasBox.width}x${canvasBox.height}`);
    } else {
      console.log('✗ Canvas has no dimensions');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/unity-vmouse-react.png', fullPage: true });
    console.log('✓ Screenshot saved to test-results/unity-vmouse-react.png');
    
    // Test direct HTML loading for comparison
    console.log('\n2. Testing direct HTML loading at http://localhost:8000...');
    try {
      await page.goto('http://localhost:8000', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      await page.waitForSelector('#unity-canvas', { timeout: 30000 });
      console.log('✓ Unity canvas found in HTML version');
      
      const hasUnityInHtml = await page.evaluate(() => {
        return window.createUnityInstance !== undefined;
      });
      console.log(`✓ createUnityInstance in HTML: ${hasUnityInHtml}`);
      
      await page.screenshot({ path: 'test-results/unity-vmouse-html.png', fullPage: true });
      console.log('✓ Screenshot saved to test-results/unity-vmouse-html.png');
    } catch (error) {
      console.log('Note: Could not test HTML version (Python server may not be running)');
    }
    
    console.log('\nTest completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();