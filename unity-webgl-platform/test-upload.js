const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to localhost:3000...');
    await page.goto('http://localhost:3000');
    
    console.log('2. Going to dashboard (should redirect to login)...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Wait for login page
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    console.log('3. Logging in with admin credentials...');
    await page.fill('input[type="email"]', 'chris.mcdaniels@ctcubed.com');
    await page.fill('input[type="password"]', 'Superman!2Superman!2');
    await page.click('button[type="submit"]');
    
    console.log('4. Waiting for dashboard to load...');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });
    
    console.log('5. Clicking Add Game button...');
    await page.click('button:has-text("Add Game")');
    
    console.log('6. Waiting for upload modal...');
    await page.waitForSelector('text=Upload Unity WebGL Game', { timeout: 10000 });
    
    console.log('7. Filling in game details...');
    await page.fill('input[placeholder="My Awesome Game"]', 'vMouse Game');
    await page.fill('input[placeholder="my-awesome-game"]', 'vmouse');
    
    console.log('8. Selecting Unity build folder...');
    // Set files using the file input
    const fileInput = await page.locator('input[type="file"]');
    const buildPath = path.join(__dirname, '..', 'vmouse_builds');
    
    // Get all files from the build directory
    const fs = require('fs');
    const getAllFiles = (dirPath, arrayOfFiles = []) => {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
          arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else {
          arrayOfFiles.push(filePath);
        }
      });
      return arrayOfFiles;
    };
    
    const allFiles = getAllFiles(buildPath);
    console.log(`Found ${allFiles.length} files to upload`);
    
    await fileInput.setInputFiles(allFiles);
    
    console.log('9. Clicking Upload Game button...');
    await page.click('button:has-text("Upload Game"):not(:has-text("Uploading"))');
    
    console.log('10. Waiting for upload to complete...');
    // Wait for the modal to close or success message
    await page.waitForSelector('text=Upload Unity WebGL Game', { 
      state: 'hidden', 
      timeout: 120000 
    });
    
    console.log('11. Verifying game appears in dashboard...');
    await page.waitForSelector('text=vMouse Game', { timeout: 10000 });
    
    console.log('12. Navigating to the game page...');
    await page.goto('http://localhost:3000/unity/vmouse');
    
    console.log('13. Waiting for Unity player to load...');
    await page.waitForSelector('canvas', { timeout: 30000 });
    
    // Wait a bit for Unity to initialize
    await page.waitForTimeout(5000);
    
    console.log('14. Taking screenshot of the game...');
    await page.screenshot({ path: 'game-loaded.png' });
    
    console.log('✅ Success! Game uploaded and loaded successfully!');
    
    // Try to interact with the game
    console.log('15. Attempting to click on the Unity canvas...');
    const canvas = await page.locator('canvas');
    await canvas.click();
    
    // Take another screenshot after interaction
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'game-after-click.png' });
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();