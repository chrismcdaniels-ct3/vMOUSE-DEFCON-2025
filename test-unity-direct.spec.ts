import { test, expect } from '@playwright/test'

test('Direct Unity automation with proper waiting', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text()
    console.log(`[${msg.type()}] ${text}`)
  })

  // Navigate to the Unity game page
  console.log('Navigating to Unity game page...')
  await page.goto('http://localhost:3000/unity/vmouse')

  // Wait for Unity to be fully loaded by checking for the canvas
  console.log('Waiting for Unity canvas...')
  await page.waitForSelector('canvas#unity-canvas', { timeout: 30000 })
  
  // Wait for the loading indicator to disappear
  await page.waitForSelector('text=✓ Game loaded and configured', { timeout: 30000 })
  
  console.log('Unity loaded successfully!')
  
  // Give Unity a bit more time to initialize
  await page.waitForTimeout(3000)

  // Now try to interact with Unity
  console.log('\n=== Attempting Unity automation ===\n')
  
  // First, check if Unity instance is available
  const unityAvailable = await page.evaluate(() => {
    return !!(window.unityInstance && window.unityBridge)
  })
  
  console.log('Unity instance available:', unityAvailable)
  
  if (!unityAvailable) {
    console.log('Unity instance not found in window object')
    return
  }

  // Try to send messages to Unity using the bridge
  const result = await page.evaluate(() => {
    const results = []
    
    if (window.unityBridge && window.unityBridge.sendToUnity) {
      // Try various GameObject and method combinations
      const attempts = [
        // Input field attempts
        { obj: 'PlayerNameInput', method: 'text', value: 'AutoPlayer' },
        { obj: 'RoomNameInput', method: 'text', value: 'AutoRoom' },
        { obj: 'PlayerName', method: 'SetText', value: 'AutoPlayer' },
        { obj: 'RoomName', method: 'SetText', value: 'AutoRoom' },
        
        // UI Manager attempts
        { obj: 'UIManager', method: 'SetPlayerName', value: 'AutoPlayer' },
        { obj: 'UIManager', method: 'SetRoomName', value: 'AutoRoom' },
        { obj: 'UIController', method: 'SetPlayerName', value: 'AutoPlayer' },
        { obj: 'UIController', method: 'SetRoomName', value: 'AutoRoom' },
        
        // Canvas attempts
        { obj: 'Canvas', method: 'SetPlayerName', value: 'AutoPlayer' },
        { obj: 'Canvas/PlayerNameInput', method: 'SetText', value: 'AutoPlayer' },
        { obj: 'Canvas/RoomNameInput', method: 'SetText', value: 'AutoRoom' },
        
        // Setup script attempts
        { obj: 'SetupUIScript', method: 'SetNickname', value: 'AutoPlayer' },
        { obj: 'SetupUIScript', method: 'SetRoomName', value: 'AutoRoom' },
        { obj: 'SetupUI', method: 'SetNickname', value: 'AutoPlayer' },
        { obj: 'SetupUI', method: 'SetRoomName', value: 'AutoRoom' },
        
        // Network manager attempts
        { obj: 'NetworkManager', method: 'SetNickname', value: 'AutoPlayer' },
        { obj: 'NetworkManager', method: 'SetRoomName', value: 'AutoRoom' },
        { obj: 'PhotonNetworkManager', method: 'SetNickname', value: 'AutoPlayer' },
        { obj: 'PhotonNetworkManager', method: 'SetRoomName', value: 'AutoRoom' }
      ]
      
      for (const attempt of attempts) {
        try {
          window.unityBridge.sendToUnity(attempt.obj, attempt.method, attempt.value)
          results.push(`Sent: ${attempt.obj}.${attempt.method}("${attempt.value}")`)
        } catch (e) {
          results.push(`Failed: ${attempt.obj}.${attempt.method} - ${e.message}`)
        }
      }
      
      // Try role selection
      const roleAttempts = [
        { obj: 'SetupUIScript', method: 'SetRole', value: 'Pilot' },
        { obj: 'SetupUIScript', method: 'SelectPilot', value: '' },
        { obj: 'PilotButton', method: 'OnClick', value: '' },
        { obj: 'Canvas/PilotButton', method: 'OnClick', value: '' }
      ]
      
      for (const attempt of roleAttempts) {
        try {
          window.unityBridge.sendToUnity(attempt.obj, attempt.method, attempt.value)
          results.push(`Role: ${attempt.obj}.${attempt.method}`)
        } catch (e) {
          // Silent fail
        }
      }
      
      // Try vehicle selection
      const vehicleAttempts = [
        { obj: 'SetupUIScript', method: 'SetVehicle', value: 'Drone' },
        { obj: 'SetupUIScript', method: 'SelectDrone', value: '' },
        { obj: 'DroneButton', method: 'OnClick', value: '' },
        { obj: 'Canvas/DroneButton', method: 'OnClick', value: '' }
      ]
      
      for (const attempt of vehicleAttempts) {
        try {
          window.unityBridge.sendToUnity(attempt.obj, attempt.method, attempt.value)
          results.push(`Vehicle: ${attempt.obj}.${attempt.method}`)
        } catch (e) {
          // Silent fail
        }
      }
      
      // Try map selection
      const mapAttempts = [
        { obj: 'SetupUIScript', method: 'SetMap', value: 'Small Map' },
        { obj: 'SetupUIScript', method: 'SelectSmallMap', value: '' },
        { obj: 'SmallMapButton', method: 'OnClick', value: '' },
        { obj: 'Canvas/SmallMapButton', method: 'OnClick', value: '' }
      ]
      
      for (const attempt of mapAttempts) {
        try {
          window.unityBridge.sendToUnity(attempt.obj, attempt.method, attempt.value)
          results.push(`Map: ${attempt.obj}.${attempt.method}`)
        } catch (e) {
          // Silent fail
        }
      }
    }
    
    return results
  })
  
  console.log('Unity bridge results:')
  result.forEach(r => console.log(`  ${r}`))
  
  // Wait to see if anything changed
  await page.waitForTimeout(2000)
  
  // Try to join the game
  console.log('\n=== Attempting to join game ===\n')
  
  await page.evaluate(() => {
    if (window.unityBridge && window.unityBridge.sendToUnity) {
      const joinAttempts = [
        { obj: 'SetupUIScript', method: 'AutoJoinTeam', value: '' },
        { obj: 'SetupUIScript', method: 'JoinTeam', value: '' },
        { obj: 'SetupUIScript', method: 'OnJoinButtonClick', value: '' },
        { obj: 'JoinTeamButton', method: 'OnClick', value: '' },
        { obj: 'Canvas/JoinTeamButton', method: 'OnClick', value: '' },
        { obj: 'GameManager', method: 'StartGame', value: '' },
        { obj: 'GameManager', method: 'JoinRoom', value: 'AutoRoom' },
        { obj: 'NetworkManager', method: 'JoinRoom', value: 'AutoRoom' }
      ]
      
      for (const attempt of joinAttempts) {
        try {
          window.unityBridge.sendToUnity(attempt.obj, attempt.method, attempt.value)
          console.log(`Join attempt: ${attempt.obj}.${attempt.method}`)
        } catch (e) {
          // Silent fail
        }
      }
    }
  })
  
  // Take screenshots
  await page.screenshot({ path: 'unity-direct-test-1.png', fullPage: true })
  
  // Wait a bit more
  await page.waitForTimeout(3000)
  
  // Check if we're still on setup screen
  const joinButtonVisible = await page.locator('text="Join Team"').isVisible().catch(() => false)
  
  if (joinButtonVisible) {
    console.log('\n❌ Still on setup screen - trying alternative approach')
    
    // Try clicking on the Unity canvas and simulating keyboard input
    console.log('\n=== Trying click and type approach ===\n')
    
    const canvas = page.locator('canvas#unity-canvas')
    const canvasBounds = await canvas.boundingBox()
    
    if (canvasBounds) {
      // Click on approximate input field positions
      // Player name input (usually top)
      await canvas.click({ position: { x: canvasBounds.width / 2, y: 100 } })
      await page.keyboard.type('AutoPlayer', { delay: 50 })
      
      // Room name input (usually below player name)
      await canvas.click({ position: { x: canvasBounds.width / 2, y: 150 } })
      await page.keyboard.type('AutoRoom', { delay: 50 })
      
      // Try clicking buttons
      // Pilot button
      await canvas.click({ position: { x: canvasBounds.width / 3, y: 200 } })
      
      // Small map button  
      await canvas.click({ position: { x: canvasBounds.width / 3, y: 250 } })
      
      // Drone button
      await canvas.click({ position: { x: canvasBounds.width / 3, y: 300 } })
      
      // Join button
      await canvas.click({ position: { x: canvasBounds.width / 2, y: 350 } })
    }
    
    await page.screenshot({ path: 'unity-direct-test-2.png', fullPage: true })
    
  } else {
    console.log('\n✅ Game appears to have started!')
  }
})