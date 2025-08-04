import { test, expect } from '@playwright/test'

test.describe('Unity WebGL Loading', () => {
  test('defcon_vmouse loads correctly in React app', async ({ page }) => {
    // Navigate to the test page
    await page.goto('http://localhost:3000/test-vmouse')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if the Unity canvas is present
    const canvas = await page.locator('#unity-canvas')
    await expect(canvas).toBeVisible({ timeout: 30000 })
    
    // Check if Unity loader script loaded
    const loaderScript = await page.locator('script[src*="defcon_vmouse.loader.js"]')
    await expect(loaderScript).toHaveCount(1)
    
    // Wait for Unity to initialize (checking for createUnityInstance)
    await page.waitForFunction(() => {
      return window.createUnityInstance !== undefined
    }, { timeout: 10000 })
    
    // Check console for successful load message
    const consoleMessages: string[] = []
    page.on('console', msg => {
      consoleMessages.push(msg.text())
    })
    
    // Wait for Unity to fully load
    await page.waitForTimeout(5000)
    
    // Check that no errors occurred
    const errors = await page.locator('.text-red-500').count()
    expect(errors).toBe(0)
    
    // Verify canvas has proper dimensions
    const canvasBox = await canvas.boundingBox()
    expect(canvasBox).not.toBeNull()
    expect(canvasBox!.width).toBeGreaterThan(0)
    expect(canvasBox!.height).toBeGreaterThan(0)
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/unity-vmouse-loaded.png', fullPage: true })
    
    console.log('Unity vMouse loaded successfully in React app!')
  })

  test('compare with direct HTML loading', async ({ page }) => {
    // Test the original HTML file
    await page.goto('http://localhost:8000')
    
    const canvas = await page.locator('#unity-canvas')
    await expect(canvas).toBeVisible({ timeout: 30000 })
    
    await page.waitForFunction(() => {
      return window.createUnityInstance !== undefined
    }, { timeout: 10000 })
    
    await page.screenshot({ path: 'test-results/unity-vmouse-html.png', fullPage: true })
    
    console.log('Unity vMouse loaded successfully in direct HTML!')
  })
})