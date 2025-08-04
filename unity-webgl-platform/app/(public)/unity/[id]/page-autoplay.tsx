'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const UnityPlayerLocal = dynamic(() => import('@/components/unity/UnityPlayerLocal'), {
  ssr: false,
})

export default function UnityGamePageAutoPlay() {
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [unityLoaded, setUnityLoaded] = useState(false)
  const unityRef = useRef<any>(null)

  // Game configuration
  const gameConfig = {
    playerName: 'AutoPilot',
    roomName: 'AutoRoom',
    role: 'pilot',
    vehicle: 'drone',
    map: 'small'
  }

  // For now, just support the vmouse game
  if (params.id !== 'vmouse') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Game not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The requested game could not be loaded.
          </p>
        </div>
      </div>
    )
  }

  const handleUnityLoaded = (unityInstance: any) => {
    console.log('Unity game loaded!')
    setLoading(false)
    setUnityLoaded(true)
    
    // Store Unity instance
    unityRef.current = unityInstance
    
    // Make available globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).unityInstance = unityInstance
    }
    
    // Automate form filling and game start
    setTimeout(() => {
      console.log('Starting automation sequence...')
      
      if (unityInstance && unityInstance.SendMessage) {
        // Based on our successful test, these patterns work
        const fillFormSequence = () => {
          // Set player name (this worked!)
          unityInstance.SendMessage('PlayerNameInputField', 'set_text', gameConfig.playerName)
          
          // Try room name with same pattern
          unityInstance.SendMessage('RoomNameInputField', 'set_text', gameConfig.roomName)
          
          // Also try simpler names
          unityInstance.SendMessage('PlayerInput', 'set_text', gameConfig.playerName)
          unityInstance.SendMessage('RoomInput', 'set_text', gameConfig.roomName)
          unityInstance.SendMessage('NicknameInput', 'set_text', gameConfig.playerName)
          
          // Try various input field patterns
          const inputPatterns = [
            'PlayerName', 'RoomName', 'Nickname',
            'PlayerNameInput', 'RoomNameInput', 
            'TMP_PlayerName', 'TMP_RoomName',
            'Canvas/PlayerNameInputField', 'Canvas/RoomNameInputField'
          ]
          
          inputPatterns.forEach(pattern => {
            try {
              unityInstance.SendMessage(pattern, 'set_text', pattern.includes('Room') ? gameConfig.roomName : gameConfig.playerName)
            } catch (e) {
              // Silent fail
            }
          })
        }
        
        // Fill form
        fillFormSequence()
        
        // Select options after a delay
        setTimeout(() => {
          console.log('Selecting game options...')
          
          // Select Pilot
          unityInstance.SendMessage('SelectPilot', 'OnClick', '')
          unityInstance.SendMessage('PilotButton', 'OnClick', '')
          unityInstance.SendMessage('Canvas/SelectPilot', 'OnClick', '')
          unityInstance.SendMessage('SetupUIScript', 'SelectPilot', '')
          
          // Select Small Map
          unityInstance.SendMessage('SmallMap', 'OnClick', '')
          unityInstance.SendMessage('SmallMapButton', 'OnClick', '')
          unityInstance.SendMessage('Canvas/SmallMap', 'OnClick', '')
          unityInstance.SendMessage('SetupUIScript', 'SelectSmallMap', '')
          
          // Select Drone
          unityInstance.SendMessage('Drone', 'OnClick', '')
          unityInstance.SendMessage('DroneButton', 'OnClick', '')
          unityInstance.SendMessage('Canvas/Drone', 'OnClick', '')
          unityInstance.SendMessage('SetupUIScript', 'SelectDrone', '')
          
        }, 1000)
        
        // Try to join after selections
        setTimeout(() => {
          console.log('Attempting to join game...')
          
          // Try various join patterns
          unityInstance.SendMessage('JoinTeam', 'OnClick', '')
          unityInstance.SendMessage('JoinTeamButton', 'OnClick', '')
          unityInstance.SendMessage('Join', 'OnClick', '')
          unityInstance.SendMessage('Canvas/JoinTeam', 'OnClick', '')
          unityInstance.SendMessage('Canvas/JoinTeamButton', 'OnClick', '')
          unityInstance.SendMessage('SetupUIScript', 'JoinTeam', '')
          unityInstance.SendMessage('SetupUIScript', 'AutoJoinTeam', '')
          unityInstance.SendMessage('SetupUIScript', 'OnJoinButtonClick', '')
          
        }, 2500)
        
      }
    }, 3000) // Give Unity time to fully initialize
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          vMOUSE - Auto Play
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <UnityPlayerLocal
            gameName="vMOUSE_builds"
            buildPath="/unity-builds/vmouse"
            className="w-full flex justify-center"
            onLoaded={handleUnityLoaded}
            onError={(error) => {
              console.error('Unity error:', error)
            }}
            onProgress={(progress) => {
              console.log('Loading progress:', progress)
            }}
          />
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Game Configuration (Auto-Fill)
          </h2>
          <div className="text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Player Name:</strong> {gameConfig.playerName}</p>
            <p><strong>Room:</strong> {gameConfig.roomName}</p>
            <p><strong>Role:</strong> {gameConfig.role}</p>
            <p><strong>Vehicle:</strong> {gameConfig.vehicle}</p>
            <p><strong>Map:</strong> {gameConfig.map}</p>
            {unityLoaded && <p className="text-green-600">✓ Game loaded - attempting auto-fill</p>}
          </div>
          <div className="mt-4 space-y-2">
            <button 
              onClick={() => {
                if (unityRef.current && unityRef.current.SendMessage) {
                  console.log('Manual retry: Setting player name...')
                  unityRef.current.SendMessage('PlayerNameInputField', 'set_text', 'ManualPlayer')
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
            >
              Set Player Name
            </button>
            <button 
              onClick={() => {
                if (unityRef.current && unityRef.current.SendMessage) {
                  console.log('Manual retry: Joining team...')
                  unityRef.current.SendMessage('JoinTeamButton', 'OnClick', '')
                  unityRef.current.SendMessage('SetupUIScript', 'AutoJoinTeam', '')
                }
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Join Team
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}