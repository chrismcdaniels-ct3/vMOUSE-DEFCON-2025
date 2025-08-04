import { test, expect } from '@playwright/test'

test('Unity WebGL input automation', async ({ page }) => {
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
  await page.waitForTimeout(5000) // Give Unity extra time

  console.log('Unity loaded! Starting automation...')

  // Try direct SendMessage to TMP_InputField components
  const inputResults = await page.evaluate(() => {
    if (!window.unityInstance || !window.unityInstance.SendMessage) {
      return 'Unity instance not available'
    }

    const results = []
    
    // Common Unity UI patterns for input fields
    const inputPatterns = [
      // TMP InputField patterns
      { obj: 'PlayerNameInput', method: 'set_text', value: 'AutoPlayer123' },
      { obj: 'RoomNameInput', method: 'set_text', value: 'AutoRoom123' },
      { obj: 'PlayerNameInputField', method: 'set_text', value: 'AutoPlayer123' },
      { obj: 'RoomNameInputField', method: 'set_text', value: 'AutoRoom123' },
      { obj: 'InputField_PlayerName', method: 'set_text', value: 'AutoPlayer123' },
      { obj: 'InputField_RoomName', method: 'set_text', value: 'AutoRoom123' },
      
      // Try with TMP_ prefix
      { obj: 'TMP_PlayerName', method: 'set_text', value: 'AutoPlayer123' },
      { obj: 'TMP_RoomName', method: 'set_text', value: 'AutoRoom123' },
      
      // Try Canvas children
      { obj: 'Canvas/PlayerNameInput', method: 'set_text', value: 'AutoPlayer123' },
      { obj: 'Canvas/RoomNameInput', method: 'set_text', value: 'AutoRoom123' },
      { obj: 'Canvas/PlayerNameInputField', method: 'set_text', value: 'AutoPlayer123' },
      { obj: 'Canvas/RoomNameInputField', method: 'set_text', value: 'AutoRoom123' },
      
      // Try with different methods
      { obj: 'PlayerNameInput', method: 'SetText', value: 'AutoPlayer123' },
      { obj: 'RoomNameInput', method: 'SetText', value: 'AutoRoom123' },
      { obj: 'PlayerNameInput', method: 'text', value: 'AutoPlayer123' },
      { obj: 'RoomNameInput', method: 'text', value: 'AutoRoom123' },
      
      // Try parent objects with child references
      { obj: 'SetupPanel', method: 'SetPlayerName', value: 'AutoPlayer123' },
      { obj: 'SetupPanel', method: 'SetRoomName', value: 'AutoRoom123' },
      { obj: 'SetupUI', method: 'SetPlayerName', value: 'AutoPlayer123' },
      { obj: 'SetupUI', method: 'SetRoomName', value: 'AutoRoom123' },
    ]
    
    for (const pattern of inputPatterns) {
      try {
        window.unityInstance.SendMessage(pattern.obj, pattern.method, pattern.value)
        results.push(`Tried: ${pattern.obj}.${pattern.method}("${pattern.value}")`)
      } catch (e) {
        // Silent fail
      }
    }
    
    return results
  })
  
  console.log('Input field attempts:', inputResults)
  
  // Wait to see if inputs were filled
  await page.waitForTimeout(2000)
  
  // Now try button clicks
  console.log('\n=== Trying button clicks ===')
  
  const buttonResults = await page.evaluate(() => {
    if (!window.unityInstance || !window.unityInstance.SendMessage) {
      return 'Unity instance not available'
    }
    
    const results = []
    
    // Button patterns
    const buttonPatterns = [
      // Direct button objects
      { obj: 'SelectPilotButton', method: 'OnClick' },
      { obj: 'PilotButton', method: 'OnClick' },
      { obj: 'SmallMapButton', method: 'OnClick' },
      { obj: 'DroneButton', method: 'OnClick' },
      { obj: 'JoinTeamButton', method: 'OnClick' },
      
      // Canvas children
      { obj: 'Canvas/SelectPilotButton', method: 'OnClick' },
      { obj: 'Canvas/PilotButton', method: 'OnClick' },
      { obj: 'Canvas/SmallMapButton', method: 'OnClick' },
      { obj: 'Canvas/DroneButton', method: 'OnClick' },
      { obj: 'Canvas/JoinTeamButton', method: 'OnClick' },
      
      // Try with Button suffix
      { obj: 'SelectPilot_Button', method: 'OnClick' },
      { obj: 'SmallMap_Button', method: 'OnClick' },
      { obj: 'Drone_Button', method: 'OnClick' },
      { obj: 'JoinTeam_Button', method: 'OnClick' },
      
      // Try direct method calls on setup script
      { obj: 'SetupUIScript', method: 'SelectPilot' },
      { obj: 'SetupUIScript', method: 'SelectSmallMap' },
      { obj: 'SetupUIScript', method: 'SelectDrone' },
      { obj: 'SetupUIScript', method: 'JoinTeam' },
    ]
    
    for (const pattern of buttonPatterns) {
      try {
        window.unityInstance.SendMessage(pattern.obj, pattern.method, '')
        results.push(`Clicked: ${pattern.obj}.${pattern.method}()`)
      } catch (e) {
        // Silent fail
      }
    }
    
    return results
  })
  
  console.log('Button click attempts:', buttonResults)
  
  // Take a screenshot
  await page.screenshot({ path: 'unity-webgl-input-test.png', fullPage: true })
  
  // Final attempt - try simulating actual input events
  console.log('\n=== Trying WebGL input simulation ===')
  
  await page.evaluate(() => {
    // Unity WebGL often uses a hidden input field for text input
    const hiddenInputs = document.querySelectorAll('input[type="text"], input:not([type])')
    console.log(`Found ${hiddenInputs.length} input elements`)
    
    hiddenInputs.forEach((input, index) => {
      console.log(`Input ${index}: id="${input.id}", name="${input.name}", value="${input.value}"`)
      
      // Try to set value and dispatch events
      if (index === 0) {
        input.value = 'WebGLPlayer123'
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      } else if (index === 1) {
        input.value = 'WebGLRoom123'  
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
  })
  
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'unity-webgl-input-test-2.png', fullPage: true })
  
  // Check if we're still on setup screen
  const setupVisible = await page.locator('text="Please enter nickname"').isVisible().catch(() => false)
  console.log('\nStill on setup screen:', setupVisible)
})