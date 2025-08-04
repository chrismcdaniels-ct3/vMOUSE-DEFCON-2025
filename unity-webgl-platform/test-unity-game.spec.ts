import { test, expect } from '@playwright/test'

test('Unity game loads successfully', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`)
  })

  // Log network errors
  page.on('pageerror', err => {
    console.error('[Page Error]', err.message)
  })

  // Log failed requests
  page.on('requestfailed', request => {
    console.error('[Request Failed]', request.url(), request.failure()?.errorText)
  })

  // Navigate to the Unity game page
  console.log('Navigating to Unity game page...')
  await page.goto('http://localhost:3000/unity/vmouse', { waitUntil: 'networkidle' })

  // Check if the page loaded
  await expect(page).toHaveTitle(/vMOUSE|Unity/)

  // Check for Unity container
  const unityContainer = page.locator('#unity-container')
  const containerExists = await unityContainer.count() > 0
  console.log('Unity container exists:', containerExists)

  // Check for Unity canvas
  const unityCanvas = page.locator('canvas#unity-canvas')
  const canvasExists = await unityCanvas.count() > 0
  console.log('Unity canvas exists:', canvasExists)

  // Wait for Unity to initialize
  console.log('Waiting for Unity to load...')
  
  // Check for any error messages
  const errorMessages = page.locator('text=/error|failed/i')
  const hasErrors = await errorMessages.count() > 0
  if (hasErrors) {
    const errorText = await errorMessages.first().textContent()
    console.error('Error found on page:', errorText)
  }

  // Take a screenshot for debugging
  await page.screenshot({ path: 'unity-game-test.png', fullPage: true })
  console.log('Screenshot saved as unity-game-test.png')

  // Check if Unity loaded successfully
  if (canvasExists) {
    // Wait for the canvas to have content
    await page.waitForTimeout(5000) // Give Unity time to load
    
    // Check if canvas has been rendered to
    const canvasHasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas#unity-canvas') as HTMLCanvasElement
      if (!canvas) return false
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return false
      
      // Get image data to check if anything has been drawn
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Check if there's any non-transparent pixel
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // Alpha channel > 0
          return true
        }
      }
      return false
    })
    
    console.log('Canvas has content:', canvasHasContent)
  }

  // Assert that we don't have errors
  expect(hasErrors).toBe(false)
})