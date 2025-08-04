import { test, expect } from '@playwright/test'

test('Test Unity automation with simplified page', async ({ page }) => {
  // Enable console logging
  const logs: string[] = []
  page.on('console', msg => {
    const text = msg.text()
    logs.push(`[${msg.type()}] ${text}`)
    console.log(`[${msg.type()}] ${text}`)
  })

  // Navigate to the Unity game page
  console.log('Navigating to Unity game page...')
  await page.goto('http://localhost:3000/unity/vmouse')

  // Wait for the "Game loaded and configured" indicator
  console.log('Waiting for Unity to load...')
  await page.waitForSelector('text=✓ Game loaded and configured', { timeout: 30000 })
  
  console.log('Unity loaded successfully!')

  // Wait additional time for Unity messages to be sent
  await page.waitForTimeout(5000)

  // Check console logs for Unity messages
  console.log('\n=== Unity Message Attempts ===')
  const unityLogs = logs.filter(log => 
    log.includes('Trying') || 
    log.includes('SendMessage') || 
    log.includes('Unity') ||
    log.includes('Attempting')
  )
  unityLogs.forEach(log => console.log(log))

  // Try clicking the manual join button
  console.log('\n=== Trying manual join button ===')
  await page.click('button:has-text("Try Manual Join")')
  await page.waitForTimeout(2000)

  // Take a screenshot to see the current state
  await page.screenshot({ path: 'unity-simple-test.png', fullPage: true })
  console.log('Screenshot saved as unity-simple-test.png')

  // Check if Unity instance is available in window
  const unityCheck = await page.evaluate(() => {
    if (window.unityInstance) {
      return {
        available: true,
        hasSendMessage: typeof window.unityInstance.SendMessage === 'function',
        type: typeof window.unityInstance
      }
    }
    return { available: false }
  })

  console.log('\n=== Unity Instance Check ===')
  console.log('Unity instance available:', unityCheck.available)
  if (unityCheck.available) {
    console.log('Has SendMessage:', unityCheck.hasSendMessage)
    console.log('Type:', unityCheck.type)
  }

  // Try direct SendMessage calls from browser
  if (unityCheck.available && unityCheck.hasSendMessage) {
    console.log('\n=== Direct SendMessage attempts ===')
    
    const results = await page.evaluate(() => {
      const attempts = []
      const objects = ['SetupUIScript', 'Canvas', 'GameManager', 'UIManager']
      
      for (const obj of objects) {
        try {
          window.unityInstance.SendMessage(obj, 'SetNickname', 'DirectTest')
          attempts.push(`Success: ${obj}.SetNickname`)
        } catch (e) {
          attempts.push(`Failed: ${obj}.SetNickname - ${e.message}`)
        }
        
        try {
          window.unityInstance.SendMessage(obj, 'AutoJoinTeam', '')
          attempts.push(`Success: ${obj}.AutoJoinTeam`)
        } catch (e) {
          attempts.push(`Failed: ${obj}.AutoJoinTeam - ${e.message}`)
        }
      }
      
      return attempts
    })
    
    results.forEach(r => console.log(`  ${r}`))
  }

  // Check if we're still on the setup screen
  const setupVisible = await page.locator('text="Join Team"').isVisible().catch(() => false)
  
  if (setupVisible) {
    console.log('\n❌ Still on setup screen - automation not successful')
    
    // Try one more approach - look for Unity-generated input fields
    const inputs = await page.locator('input').all()
    console.log(`\nFound ${inputs.length} input fields`)
    
    // Try filling any visible inputs
    for (let i = 0; i < Math.min(inputs.length, 2); i++) {
      if (await inputs[i].isVisible()) {
        console.log(`Filling input ${i}...`)
        await inputs[i].fill(i === 0 ? 'FinalTestPlayer' : 'FinalTestRoom')
      }
    }
    
    // Look for any clickable buttons
    const buttons = await page.locator('button').all()
    console.log(`Found ${buttons.length} buttons`)
    
    await page.screenshot({ path: 'unity-simple-test-final.png', fullPage: true })
  } else {
    console.log('\n✅ Game appears to have started!')
  }
})