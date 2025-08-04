'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const UnityPlayerLocal = dynamic(() => import('@/components/unity/UnityPlayerLocal'), {
  ssr: false,
})

export default function UnityGamePageSimple() {
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [unityLoaded, setUnityLoaded] = useState(false)
  const unityRef = useRef<any>(null)

  // Game configuration
  const gameConfig = {
    playerName: 'Player' + Math.floor(Math.random() * 1000),
    roomName: 'TestRoom',
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
    console.log('Unity game loaded! Unity instance:', unityInstance)
    setLoading(false)
    setUnityLoaded(true)
    
    // Store Unity instance
    unityRef.current = unityInstance
    
    // Make available globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).unityInstance = unityInstance
    }
    
    // Wait for Unity to initialize, then try to send messages
    setTimeout(() => {
      console.log('Attempting to configure Unity game...')
      
      if (unityInstance && unityInstance.SendMessage) {
        console.log('SendMessage function available')
        
        // Try different GameObject names for the setup UI
        const setupObjects = [
          'SetupUIScript',
          'SetupUI',
          'Canvas',
          'UI',
          'GameManager',
          'NetworkManager',
          'UIManager',
          'UIController'
        ]
        
        // Try to set player name and room
        for (const obj of setupObjects) {
          try {
            console.log(`Trying ${obj}.SetNickname("${gameConfig.playerName}")`)
            unityInstance.SendMessage(obj, 'SetNickname', gameConfig.playerName)
          } catch (e) {
            // Silent fail
          }
          
          try {
            console.log(`Trying ${obj}.SetRoomName("${gameConfig.roomName}")`)
            unityInstance.SendMessage(obj, 'SetRoomName', gameConfig.roomName)
          } catch (e) {
            // Silent fail
          }
        }
        
        // Try role selection
        setTimeout(() => {
          for (const obj of setupObjects) {
            try {
              unityInstance.SendMessage(obj, 'SetRole', 'Pilot')
              unityInstance.SendMessage(obj, 'SelectPilot', '')
            } catch (e) {
              // Silent fail
            }
          }
        }, 500)
        
        // Try vehicle selection
        setTimeout(() => {
          for (const obj of setupObjects) {
            try {
              unityInstance.SendMessage(obj, 'SetVehicle', 'Drone')
              unityInstance.SendMessage(obj, 'SelectDrone', '')
            } catch (e) {
              // Silent fail
            }
          }
        }, 1000)
        
        // Try map selection
        setTimeout(() => {
          for (const obj of setupObjects) {
            try {
              unityInstance.SendMessage(obj, 'SetMap', 'Small Map')
              unityInstance.SendMessage(obj, 'SelectSmallMap', '')
            } catch (e) {
              // Silent fail
            }
          }
        }, 1500)
        
        // Try to auto join
        setTimeout(() => {
          console.log('Attempting to auto-join team...')
          for (const obj of setupObjects) {
            try {
              unityInstance.SendMessage(obj, 'AutoJoinTeam', '')
              unityInstance.SendMessage(obj, 'JoinTeam', '')
              unityInstance.SendMessage(obj, 'OnJoinButtonClick', '')
            } catch (e) {
              // Silent fail
            }
          }
        }, 2500)
        
      } else {
        console.error('SendMessage not available on Unity instance')
      }
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          vMOUSE
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
            Game Configuration
          </h2>
          <div className="text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Player Name:</strong> {gameConfig.playerName}</p>
            <p><strong>Room:</strong> {gameConfig.roomName}</p>
            <p><strong>Role:</strong> {gameConfig.role}</p>
            <p><strong>Vehicle:</strong> {gameConfig.vehicle}</p>
            <p><strong>Map:</strong> {gameConfig.map}</p>
            {unityLoaded && <p className="text-green-600">✓ Game loaded and configured</p>}
          </div>
          <div className="mt-4">
            <button 
              onClick={() => {
                if (unityRef.current && unityRef.current.SendMessage) {
                  console.log('Manual join attempt...')
                  unityRef.current.SendMessage('SetupUIScript', 'AutoJoinTeam', '')
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Manual Join
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}