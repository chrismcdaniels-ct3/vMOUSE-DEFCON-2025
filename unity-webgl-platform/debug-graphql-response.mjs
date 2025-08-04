import { chromium } from 'playwright';

async function debugGraphQLResponse() {
  const browser = await chromium.launch({ 
    headless: true,
    devtools: false 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept GraphQL responses
  page.on('response', async response => {
    if (response.url().includes('graphql')) {
      try {
        const body = await response.json();
        console.log('\n📡 GraphQL Response:');
        console.log('Status:', response.status());
        console.log('Response Body:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('Could not parse response as JSON');
      }
    }
  });

  try {
    console.log('📱 Loading homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait for GraphQL request
    await page.waitForTimeout(3000);

    // Also try to get the error from the page
    const errorMessage = await page.evaluate(() => {
      const errorDiv = document.querySelector('.bg-red-100');
      return errorDiv ? errorDiv.textContent : null;
    });

    if (errorMessage) {
      console.log('\n❌ Error displayed on page:', errorMessage);
    }

  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugGraphQLResponse().catch(console.error);