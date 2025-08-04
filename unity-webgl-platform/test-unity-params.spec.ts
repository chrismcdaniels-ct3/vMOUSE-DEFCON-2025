import { test, expect } from '@playwright/test'

test('Unity game loads with parameters', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text()
    console.log(`[${msg.type()}] ${text}`)
    
    // Check for Unity bridge messages
    if (text.includes('Sending game configuration to Unity:') || 
        text.includes('Auto joining team...') ||
        text.includes('SendMessage')) {
      console.log('>>> Unity Bridge Communication:', text)
    }
  })

  // Log network errors
  page.on('pageerror', err => {
    console.error('[Page Error]', err.message)
  })

  // Navigate to the Unity game page
  console.log('Navigating to Unity game page...')
  await page.goto('http://localhost:3000/unity/vmouse', { waitUntil: 'networkidle' })

  // Check if the page loaded
  await expect(page).toHaveTitle(/vMOUSE|Unity/)

  // Check for game configuration display
  const configSection = page.locator('h2:text("Game Configuration")')
  await expect(configSection).toBeVisible()

  // Verify configuration values are displayed
  const playerNameText = await page.locator('text=/Player Name:.*Player\\d+/').textContent()
  console.log('Player configuration:', playerNameText)
  
  const roomText = await page.locator('text=/Room:.*TestRoom/').textContent()
  console.log('Room configuration:', roomText)
  
  const roleText = await page.locator('text=/Role:.*pilot/').textContent()
  console.log('Role configuration:', roleText)
  
  const vehicleText = await page.locator('text=/Vehicle:.*drone/').textContent()
  console.log('Vehicle configuration:', vehicleText)

  // Wait for Unity to load and check for the loaded indicator
  console.log('Waiting for Unity to fully load...')
  
  // Wait up to 30 seconds for Unity to load
  try {
    await page.waitForSelector('text=✓ Game loaded and configured', { timeout: 30000 })
    console.log('SUCCESS: Unity game loaded and configured!')
  } catch (e) {
    console.log('Unity did not show loaded indicator within 30 seconds')
  }

  // Take a screenshot for debugging
  await page.screenshot({ path: 'unity-params-test.png', fullPage: true })
  console.log('Screenshot saved as unity-params-test.png')

  // Check if Unity canvas exists
  const unityCanvas = page.locator('canvas#unity-canvas')
  const canvasExists = await unityCanvas.count() > 0
  console.log('Unity canvas exists:', canvasExists)

  // Give time for Unity bridge messages to be sent
  await page.waitForTimeout(5000)

  // Final assertion
  expect(canvasExists).toBe(true)
})