import { chromium } from 'playwright';

async function debugGamesLoading() {
  const browser = await chromium.launch({ 
    headless: true,
    devtools: false 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`Browser console [${msg.type()}]:`, msg.text());
  });

  // Log network requests to GraphQL
  page.on('request', request => {
    if (request.url().includes('graphql') || request.url().includes('api')) {
      console.log('Request:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('graphql') || response.url().includes('api')) {
      console.log('Response:', response.status(), response.url());
    }
  });

  try {
    console.log('📱 Loading homepage...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Wait for potential games to load
    await page.waitForTimeout(3000);

    // Check if loading message is present
    const loadingText = await page.locator('text=Loading...').count();
    console.log('Loading indicators found:', loadingText);

    // Check for "No games available" message
    const noGamesText = await page.locator('text=No games available').count();
    console.log('No games message found:', noGamesText);

    // Check for game links
    const gameLinks = await page.locator('a[href^="/unity/"]').count();
    console.log('Game links found:', gameLinks);

    // Get all game names
    if (gameLinks > 0) {
      const games = await page.locator('a[href^="/unity/"]').all();
      for (const game of games) {
        const href = await game.getAttribute('href');
        const text = await game.textContent();
        console.log(`Found game: ${text} -> ${href}`);
      }
    }

    // Check network errors in browser console
    const errors = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('graphql') || entry.name.includes('api'))
        .map(entry => ({
          name: entry.name,
          duration: entry.duration,
          status: entry.responseStatus || 'unknown'
        }));
    });
    console.log('Network performance:', errors);

    // Try to intercept the GraphQL query
    console.log('\n🔍 Intercepting GraphQL queries...');
    
    // Reload the page with request interception
    await page.route('**/graphql**', async route => {
      const request = route.request();
      console.log('GraphQL Request Body:', await request.postData());
      await route.continue();
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Check localStorage for any cached data
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.includes('aws') || key.includes('amplify')) {
          items[key] = window.localStorage.getItem(key);
        }
      }
      return items;
    });
    console.log('\nLocalStorage AWS/Amplify items:', Object.keys(localStorage));

    // Take a screenshot for visual debugging
    await page.screenshot({ path: 'homepage-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved as homepage-debug.png');

  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugGamesLoading().catch(console.error);