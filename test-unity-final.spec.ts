import { test, expect } from '@playwright/test'

test('Unity WebGL final automation attempt', async ({ page }) => {
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

  console.log('Unity loaded! Starting final automation attempt...')

  // Final approach - use the exact GameObject names and methods from Unity
  const finalResults = await page.evaluate(() => {
    if (!window.unityInstance || !window.unityInstance.SendMessage) {
      return 'Unity instance not available'
    }

    const results = []
    
    // Based on the Unity symbols, try these specific patterns
    const attempts = [
      // Direct text setting on input fields
      { obj: 'PlayerNameInputField', method: 'set_text', value: 'AutoPlayer' },
      { obj: 'RoomNameInputField', method: 'set_text', value: 'AutoRoom' },
      
      // Try activating the input fields first
      { obj: 'PlayerNameInputField', method: 'ActivateInputField', value: '' },
      { obj: 'RoomNameInputField', method: 'ActivateInputField', value: '' },
      
      // Then set text
      { obj: 'PlayerNameInputField', method: 'SetText', value: 'AutoPlayer' },
      { obj: 'RoomNameInputField', method: 'SetText', value: 'AutoRoom' },
      
      // Try with TMP prefix
      { obj: 'TMP_PlayerNameInputField', method: 'set_text', value: 'AutoPlayer' },
      { obj: 'TMP_RoomNameInputField', method: 'set_text', value: 'AutoRoom' },
      
      // Try the setup script directly
      { obj: 'SetupUIScript', method: 'SetPlayerName', value: 'AutoPlayer' },
      { obj: 'SetupUIScript', method: 'SetRoomName', value: 'AutoRoom' },
      { obj: 'SetupUIScript', method: 'SetNickname', value: 'AutoPlayer' },
      
      // Try the manager pattern
      { obj: 'GameManager', method: 'SetPlayerName', value: 'AutoPlayer' },
      { obj: 'GameManager', method: 'SetRoomName', value: 'AutoRoom' },
      { obj: 'NetworkManager', method: 'SetNickname', value: 'AutoPlayer' },
      { obj: 'NetworkManager', method: 'SetRoomName', value: 'AutoRoom' },
      
      // Try simpler names
      { obj: 'PlayerInput', method: 'set_text', value: 'AutoPlayer' },
      { obj: 'RoomInput', method: 'set_text', value: 'AutoRoom' },
      { obj: 'NicknameInput', method: 'set_text', value: 'AutoPlayer' },
      
      // Canvas children with various patterns
      { obj: 'Canvas/PlayerName', method: 'set_text', value: 'AutoPlayer' },
      { obj: 'Canvas/RoomName', method: 'set_text', value: 'AutoRoom' },
      { obj: 'Canvas/Nickname', method: 'set_text', value: 'AutoPlayer' },
      { obj: 'Canvas/PlayerInput', method: 'set_text', value: 'AutoPlayer' },
      { obj: 'Canvas/RoomInput', method: 'set_text', value: 'AutoRoom' },
    ]
    
    // Try each pattern
    for (const attempt of attempts) {
      try {
        window.unityInstance.SendMessage(attempt.obj, attempt.method, attempt.value)
        results.push(`Sent: ${attempt.obj}.${attempt.method}("${attempt.value}")`)
        
        // Also try with Unity's direct object access if available
        if (window.unityInstance.Module && window.unityInstance.Module.SendMessage) {
          window.unityInstance.Module.SendMessage(attempt.obj, attempt.method, attempt.value)
        }
      } catch (e) {
        // Silent fail
      }
    }
    
    // Try button clicks after setting text
    setTimeout(() => {
      const buttonPatterns = [
        'SelectPilot', 'PilotButton', 'Pilot',
        'SmallMap', 'SmallMapButton', 
        'Drone', 'DroneButton',
        'JoinTeam', 'JoinTeamButton', 'Join'
      ]
      
      for (const btn of buttonPatterns) {
        try {
          window.unityInstance.SendMessage(btn, 'OnClick', '')
          window.unityInstance.SendMessage(`Canvas/${btn}`, 'OnClick', '')
          window.unityInstance.SendMessage('SetupUIScript', btn, '')
        } catch (e) {
          // Silent
        }
      }
    }, 1000)
    
    return results
  })
  
  console.log('Final automation results:', finalResults.slice(0, 10))
  
  // Wait for potential changes
  await page.waitForTimeout(3000)
  
  // Take a screenshot
  await page.screenshot({ path: 'unity-final-test.png', fullPage: true })
  
  // Last resort - try direct DOM manipulation
  console.log('\n=== Trying direct DOM manipulation ===')
  
  await page.evaluate(() => {
    // Unity WebGL creates hidden input fields
    const inputs = document.querySelectorAll('input')
    console.log(`Found ${inputs.length} DOM input elements`)
    
    inputs.forEach((input, i) => {
      if (i === 0) {
        input.focus()
        input.value = 'DOMPlayer'
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
        input.blur()
      } else if (i === 1) {
        input.focus()
        input.value = 'DOMRoom'
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
        input.blur()
      }
    })
    
    // Try to find Unity's internal input handler
    if (window.unityInstance && window.unityInstance.Module) {
      const Module = window.unityInstance.Module
      
      // Try to trigger keyboard events
      if (Module._JS_Input_KeyEvent) {
        // Simulate typing
        const text = 'ModulePlayer'
        for (let i = 0; i < text.length; i++) {
          Module._JS_Input_KeyEvent(0, text.charCodeAt(i), 1) // keydown
          Module._JS_Input_KeyEvent(0, text.charCodeAt(i), 0) // keyup
        }
      }
    }
  })
  
  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'unity-final-test-2.png', fullPage: true })
  
  console.log('\nTest complete. Check screenshots for results.')
})