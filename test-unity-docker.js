const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting Unity WebGL loading test...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('Page console:', msg.text()));
    page.on('error', err => console.error('Page error:', err));
    page.on('pageerror', err => console.error('Page error:', err));
    
    // Test the local Unity player
    console.log('\n1. Testing local Unity player at /test-vmouse...');
    await page.goto('http://localhost:3000/test-vmouse', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for Unity canvas
    await page.waitForSelector('#unity-canvas', { timeout: 30000 });
    console.log('✓ Unity canvas found');
    
    // Check if Unity loader script is loaded
    const loaderScript = await page.$('script[src*="defcon_vmouse.loader.js"]');
    if (loaderScript) {
      console.log('✓ Unity loader script loaded');
    } else {
      console.log('✗ Unity loader script not found');
    }
    
    // Wait for createUnityInstance to be available
    const hasUnityInstance = await page.waitForFunction(
      () => window.createUnityInstance !== undefined,
      { timeout: 10000 }
    ).catch(() => false);
    
    if (hasUnityInstance) {
      console.log('✓ createUnityInstance function available');
    } else {
      console.log('✗ createUnityInstance function not available');
    }
    
    // Check for errors
    const errors = await page.$$('.text-red-500');
    if (errors.length === 0) {
      console.log('✓ No error messages displayed');
    } else {
      console.log(`✗ Found ${errors.length} error messages`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/unity-vmouse-react.png', fullPage: true });
    console.log('✓ Screenshot saved to test-results/unity-vmouse-react.png');
    
    // Test direct HTML loading for comparison
    console.log('\n2. Testing direct HTML loading at http://localhost:8000...');
    await page.goto('http://localhost:8000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForSelector('#unity-canvas', { timeout: 30000 });
    console.log('✓ Unity canvas found in HTML version');
    
    await page.screenshot({ path: 'test-results/unity-vmouse-html.png', fullPage: true });
    console.log('✓ Screenshot saved to test-results/unity-vmouse-html.png');
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();