// Test Unity loading functionality
// This test uses the existing test-upload-playwright.js as a template

const { chromium } = require('playwright');

async function testUnityLoading() {
  console.log('Starting Unity WebGL loading test...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('Page console:', msg.text());
  });
  
  page.on('pageerror', err => {
    console.error('Page error:', err);
  });

  try {
    // Test 1: Load the test page
    console.log('1. Loading Unity test page...');
    await page.goto('http://localhost:3000/test-vmouse', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    console.log('   Page loaded, waiting for Unity canvas...');
    
    // Wait for the Unity canvas to appear
    const canvas = await page.waitForSelector('#unity-canvas', { 
      timeout: 30000,
      state: 'visible' 
    });
    
    if (canvas) {
      console.log('✓ Unity canvas element found and visible');
    }
    
    // Check if Unity loader script is present
    const loaderScript = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(script => script.src.includes('defcon_vmouse.loader.js'));
    });
    
    console.log(loaderScript ? '✓ Unity loader script loaded' : '✗ Unity loader script not found');
    
    // Wait a bit for Unity to initialize
    await page.waitForTimeout(5000);
    
    // Check if createUnityInstance is available
    const hasUnityInstance = await page.evaluate(() => {
      return typeof window.createUnityInstance !== 'undefined';
    });
    
    console.log(hasUnityInstance ? '✓ createUnityInstance function available' : '✗ createUnityInstance function not available');
    
    // Check for any error messages
    const errorElements = await page.$$('.text-red-500');
    if (errorElements.length === 0) {
      console.log('✓ No error messages displayed');
    } else {
      const errorText = await page.$eval('.text-red-500', el => el.textContent);
      console.log(`✗ Error found: ${errorText}`);
    }
    
    // Get canvas dimensions
    const canvasBox = await canvas.boundingBox();
    if (canvasBox && canvasBox.width > 0) {
      console.log(`✓ Canvas dimensions: ${canvasBox.width}x${canvasBox.height}`);
    } else {
      console.log('✗ Canvas has no dimensions');
    }
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results/unity-vmouse-react.png', 
      fullPage: true 
    });
    console.log('✓ Screenshot saved to test-results/unity-vmouse-react.png');
    
    // Test 2: Check if Unity files are being served correctly
    console.log('\n2. Checking Unity file accessibility...');
    const fileChecks = [
      '/unity-builds/defcon_vmouse/Build/defcon_vmouse.loader.js',
      '/unity-builds/defcon_vmouse/Build/defcon_vmouse.framework.js',
      '/unity-builds/defcon_vmouse/Build/defcon_vmouse.wasm'
    ];
    
    for (const file of fileChecks) {
      const response = await page.request.get(`http://localhost:3000${file}`);
      if (response.ok()) {
        console.log(`✓ ${file} - Status: ${response.status()}`);
      } else {
        console.log(`✗ ${file} - Status: ${response.status()}`);
      }
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testUnityLoading().catch(console.error);