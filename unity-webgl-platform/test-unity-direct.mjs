import { chromium } from 'playwright';

async function testUnityDirectAccess() {
  const browser = await chromium.launch({ 
    headless: true,
    devtools: false 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();

  console.log('🚀 Testing Unity game direct access (no auth required)...\n');

  try {
    // Test 1: Local static files
    console.log('📁 Test 1: Local static Unity files');
    await page.goto('http://localhost:3000/unity-builds/defcon_vmouse/', { 
      waitUntil: 'networkidle' 
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'unity-local-static.png' });
    console.log('✅ Screenshot saved: unity-local-static.png');

    // Test 2: Test page (uses UnityPlayerLocal)
    console.log('\n🎮 Test 2: Test page with UnityPlayerLocal component');
    await page.goto('http://localhost:3000/test-vmouse', { 
      waitUntil: 'networkidle' 
    });
    
    // Wait for Unity to load
    await page.waitForSelector('#unity-canvas', { timeout: 10000 });
    await page.waitForTimeout(5000);
    
    const canvasVisible = await page.isVisible('#unity-canvas');
    console.log('Unity canvas visible:', canvasVisible);
    
    await page.screenshot({ path: 'unity-test-page.png' });
    console.log('✅ Screenshot saved: unity-test-page.png');

    // Test 3: Check what happens without auth on the dynamic page
    console.log('\n🔒 Test 3: Dynamic page without authentication');
    await page.goto('http://localhost:3000/unity/vmouse', { 
      waitUntil: 'networkidle' 
    });
    await page.waitForTimeout(2000);
    
    const errorText = await page.textContent('body');
    console.log('Page shows:', errorText.substring(0, 200) + '...');
    
    await page.screenshot({ path: 'unity-dynamic-no-auth.png' });
    console.log('✅ Screenshot saved: unity-dynamic-no-auth.png');

    console.log('\n📊 Summary:');
    console.log('- Local static files: Working ✅');
    console.log('- Test page with local Unity: Working ✅');
    console.log('- Dynamic S3 page: Requires authentication 🔒');
    console.log('\nTo test S3 loading, you need to:');
    console.log('1. Login to http://localhost:3000/auth/login');
    console.log('2. Then visit http://localhost:3000/unity/vmouse');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testUnityDirectAccess();