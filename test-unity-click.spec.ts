import { test, expect } from '@playwright/test'

test('Unity automation with click and type', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`)
  })

  // Navigate to the Unity game page
  console.log('Navigating to Unity game page...')
  await page.goto('http://localhost:3000/unity/vmouse')

  // Wait for Unity to load
  console.log('Waiting for Unity to load...')
  await page.waitForSelector('text=✓ Game loaded and configured', { timeout: 30000 })
  await page.waitForTimeout(3000) // Give Unity extra time to fully initialize

  console.log('Unity loaded! Starting automation...')

  // Get the Unity canvas element
  const canvas = page.locator('canvas#unity-canvas')
  const box = await canvas.boundingBox()
  
  if (!box) {
    console.error('Could not find Unity canvas bounds')
    return
  }

  console.log(`Canvas dimensions: ${box.width}x${box.height}`)

  // Calculate positions based on the screenshot layout
  // The form appears to be centered in the canvas
  const centerX = box.x + box.width / 2
  const formStartY = box.y + 200 // Form starts around 200px from top

  // Click on player name input field (first input)
  console.log('Clicking on player name input...')
  await page.mouse.click(centerX, formStartY + 10)
  await page.waitForTimeout(500)
  
  // Clear existing text and type new player name
  await page.keyboard.press('Control+A') // Select all
  await page.keyboard.type('AutoPilot123', { delay: 50 })
  
  // Tab to room name field
  console.log('Moving to room name input...')
  await page.keyboard.press('Tab')
  await page.waitForTimeout(500)
  
  // Type room name
  await page.keyboard.type('AutoRoom123', { delay: 50 })
  
  // Click "Select Pilot" button (left button in the role selection)
  console.log('Selecting Pilot role...')
  const pilotButtonX = centerX - 110 // Left side button
  const roleButtonY = formStartY + 100
  await page.mouse.click(pilotButtonX, roleButtonY)
  await page.waitForTimeout(500)
  
  // Click "Small Map" button (left button in map selection)
  console.log('Selecting Small Map...')
  const smallMapButtonX = centerX - 110
  const mapButtonY = formStartY + 140
  await page.mouse.click(smallMapButtonX, mapButtonY)
  await page.waitForTimeout(500)
  
  // Click "Drone" button (left button in vehicle selection)
  console.log('Selecting Drone vehicle...')
  const droneButtonX = centerX - 110
  const vehicleButtonY = formStartY + 180
  await page.mouse.click(droneButtonX, vehicleButtonY)
  await page.waitForTimeout(500)
  
  // Click "Join Team" button
  console.log('Clicking Join Team button...')
  const joinButtonY = formStartY + 220
  await page.mouse.click(centerX, joinButtonY)
  
  // Wait to see if the game starts
  await page.waitForTimeout(5000)
  
  // Take a screenshot to see the result
  await page.screenshot({ path: 'unity-click-test.png', fullPage: true })
  console.log('Screenshot saved as unity-click-test.png')
  
  // Check if we're still on the setup screen
  const setupText = await page.locator('text="Please enter nickname"').isVisible().catch(() => false)
  
  if (setupText) {
    console.log('❌ Still on setup screen - trying alternative positions...')
    
    // Try clicking directly on visible text positions
    await page.locator('text="Select Pilot"').click().catch(() => {})
    await page.waitForTimeout(500)
    await page.locator('text="Small Map"').click().catch(() => {})
    await page.waitForTimeout(500)
    await page.locator('text="Drone"').click().catch(() => {})
    await page.waitForTimeout(500)
    await page.locator('text="Join Team"').click().catch(() => {})
    
    await page.screenshot({ path: 'unity-click-test-2.png', fullPage: true })
  } else {
    console.log('✅ Game appears to have started!')
  }
})