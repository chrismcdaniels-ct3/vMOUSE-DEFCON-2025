import { test, expect } from '@playwright/test'

test('Find Unity GameObject names and automate form', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text()
    console.log(`[${msg.type()}] ${text}`)
  })

  // Navigate to the Unity game page
  console.log('Navigating to Unity game page...')
  await page.goto('http://localhost:3000/unity/vmouse', { waitUntil: 'networkidle' })

  // Wait for Unity to load
  console.log('Waiting for Unity to fully load...')
  await page.waitForTimeout(10000) // Give Unity 10 seconds to load

  // Try to interact with Unity through JavaScript
  console.log('\n=== Testing Unity automation approaches ===\n')

  // Approach 1: Try common Unity UI GameObject names
  const gameObjectNames = [
    'Canvas',
    'Canvas/SetupPanel',
    'Canvas/Setup Panel',
    'SetupPanel',
    'Setup Panel',
    'UICanvas',
    'UI Canvas',
    'MainCanvas',
    'SetupUIScript',
    'Setup UI Script',
    'UIManager',
    'UI Manager',
    'GameManager',
    'Game Manager',
    'NetworkManager',
    'Network Manager',
    'PlayerNameInput',
    'Player Name Input',
    'PlayerNameInputField',
    'RoomNameInput',
    'Room Name Input',
    'RoomNameInputField',
    'InputField_PlayerName',
    'InputField_RoomName',
    'TMP_PlayerName',
    'TMP_RoomName'
  ]

  // Test each GameObject name
  for (const objName of gameObjectNames) {
    console.log(`\nTesting GameObject: "${objName}"`)
    
    try {
      const result = await page.evaluate((name) => {
        if (window.unityInstance && window.unityInstance.SendMessage) {
          try {
            // Try to set player name
            window.unityInstance.SendMessage(name, 'SetText', 'TestPlayer123')
            window.unityInstance.SendMessage(name, 'SetValue', 'TestPlayer123')
            window.unityInstance.SendMessage(name, 'SetNickname', 'TestPlayer123')
            window.unityInstance.SendMessage(name, 'text', 'TestPlayer123')
            return `Sent messages to ${name}`
          } catch (e) {
            return `Error with ${name}: ${e.message}`
          }
        }
        return 'Unity instance not found'
      }, objName)
      
      console.log(`  Result: ${result}`)
    } catch (e) {
      console.log(`  Error: ${e.message}`)
    }
  }

  // Approach 2: Try to find input fields in the DOM
  console.log('\n=== Checking for input fields in DOM ===\n')
  
  const inputFields = await page.locator('input').all()
  console.log(`Found ${inputFields.length} input fields`)
  
  for (let i = 0; i < inputFields.length; i++) {
    const field = inputFields[i]
    const placeholder = await field.getAttribute('placeholder').catch(() => null)
    const name = await field.getAttribute('name').catch(() => null)
    const id = await field.getAttribute('id').catch(() => null)
    
    console.log(`Input ${i}: placeholder="${placeholder}", name="${name}", id="${id}"`)
    
    // Try to fill fields based on placeholder
    if (placeholder?.toLowerCase().includes('player') || placeholder?.toLowerCase().includes('name')) {
      console.log('  -> Filling as player name field')
      await field.fill('AutoPlayer123')
    } else if (placeholder?.toLowerCase().includes('room')) {
      console.log('  -> Filling as room name field')
      await field.fill('AutoRoom')
    }
  }

  // Approach 3: Try button clicks
  console.log('\n=== Testing button clicks ===\n')
  
  const buttonSelectors = [
    'button:has-text("Select Pilot")',
    'button:has-text("Pilot")',
    'button:has-text("Small Map")',
    'button:has-text("Drone")',
    'button:has-text("Join Team")',
    'button:has-text("Join")',
    '[role="button"]:has-text("Pilot")',
    '[role="button"]:has-text("Join")'
  ]
  
  for (const selector of buttonSelectors) {
    try {
      const button = page.locator(selector).first()
      if (await button.isVisible({ timeout: 1000 })) {
        console.log(`Found button: ${selector}`)
        await button.click()
        await page.waitForTimeout(500)
      }
    } catch (e) {
      // Button not found
    }
  }

  // Approach 4: Try Unity-specific methods
  console.log('\n=== Testing Unity-specific methods ===\n')
  
  const unityMethods = [
    { obj: 'SetupUIScript', method: 'SetNickname', value: 'AutoPlayer' },
    { obj: 'SetupUIScript', method: 'SetRoomName', value: 'AutoRoom' },
    { obj: 'SetupUIScript', method: 'SetRole', value: 'Pilot' },
    { obj: 'SetupUIScript', method: 'SetVehicle', value: 'Drone' },
    { obj: 'SetupUIScript', method: 'AutoJoinTeam', value: '' },
    { obj: 'GameManager', method: 'StartGame', value: '' },
    { obj: 'GameManager', method: 'JoinRoom', value: 'AutoRoom' },
    { obj: 'NetworkManager', method: 'JoinRoom', value: 'AutoRoom' },
    { obj: 'PhotonManager', method: 'JoinRoom', value: 'AutoRoom' }
  ]
  
  for (const { obj, method, value } of unityMethods) {
    const result = await page.evaluate(({ o, m, v }) => {
      if (window.unityInstance && window.unityInstance.SendMessage) {
        try {
          window.unityInstance.SendMessage(o, m, v)
          return `Success: ${o}.${m}("${v}")`
        } catch (e) {
          return `Failed: ${o}.${m} - ${e.message}`
        }
      }
      return 'Unity instance not available'
    }, { o: obj, m: method, v: value })
    
    console.log(result)
  }

  // Take a screenshot to see the current state
  await page.screenshot({ path: 'unity-automation-test.png', fullPage: true })
  console.log('\nScreenshot saved as unity-automation-test.png')

  // Wait a bit to see if anything changed
  await page.waitForTimeout(3000)

  // Check if we're still on the setup screen or if the game started
  const joinButton = page.locator('button:has-text("Join Team")')
  const isStillOnSetup = await joinButton.isVisible().catch(() => false)
  
  if (!isStillOnSetup) {
    console.log('\n✅ SUCCESS: Game appears to have started!')
  } else {
    console.log('\n❌ Still on setup screen - automation not successful yet')
    
    // Try one more approach - simulate actual user input
    console.log('\n=== Trying keyboard/mouse simulation ===\n')
    
    // Click on the Unity canvas to focus it
    const canvas = page.locator('canvas#unity-canvas')
    await canvas.click({ position: { x: 500, y: 200 } }) // Click near where inputs might be
    
    // Try typing directly
    await page.keyboard.type('AutoPlayer456')
    await page.keyboard.press('Tab')
    await page.keyboard.type('AutoRoom456')
    
    // Take another screenshot
    await page.screenshot({ path: 'unity-automation-test-2.png', fullPage: true })
  }
})