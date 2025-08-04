'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { UnityBridge } from '@/lib/unity-bridge'

const UnityPlayerLocal = dynamic(() => import('@/components/unity/UnityPlayerLocal'), {
  ssr: false,
})

export default function UnityGamePageAuto() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [unityLoaded, setUnityLoaded] = useState(false)
  const bridgeRef = useRef<UnityBridge | null>(null)

  // Game configuration with URL params support
  const gameConfig = {
    playerName: 'Player' + Math.floor(Math.random() * 1000),
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
    console.log('Unity game loaded! Setting up auto-play...')
    setLoading(false)
    setUnityLoaded(true)
    
    // Create Unity bridge
    const bridge = new UnityBridge(unityInstance)
    bridgeRef.current = bridge
    
    // Make available globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).unityInstance = unityInstance
      (window as any).unityBridge = bridge
    }
    
    // Try a different approach - simulate user input
    setTimeout(() => {
      console.log('Attempting to auto-fill form and start game...')
      
      // Use Unity's built-in SendMessage function directly
      if (unityInstance.SendMessage) {
        console.log('Using SendMessage directly...')
        
        // Try to set the input field values directly
        try {
          // Set player name
          unityInstance.SendMessage('PlayerNameInput', 'SetText', gameConfig.playerName)
          unityInstance.SendMessage('RoomNameInput', 'SetText', gameConfig.roomName)
          
          // Select pilot role
          unityInstance.SendMessage('PilotButton', 'OnClick', '')
          unityInstance.SendMessage('SelectPilotButton', 'OnClick', '')
          
          // Select small map
          unityInstance.SendMessage('SmallMapButton', 'OnClick', '')
          
          // Select drone vehicle
          unityInstance.SendMessage('DroneButton', 'OnClick', '')
          
          // Click join team button
          setTimeout(() => {
            unityInstance.SendMessage('JoinTeamButton', 'OnClick', '')
            unityInstance.SendMessage('JoinButton', 'OnClick', '')
          }, 500)
          
        } catch (e) {
          console.error('Direct SendMessage failed:', e)
        }
        
        // Also try the original approach with different object names
        const setupObjects = [
          'SetupUIScript',
          'Setup UI Script',
          'SetupUI',
          'GameSetup',
          'UIController',
          'Canvas',
          'UI',
          'NetworkManager',
          'GameManager'
        ]
        
        for (const obj of setupObjects) {
          console.log(`Trying object: ${obj}`)
          try {
            unityInstance.SendMessage(obj, 'SetNickname', gameConfig.playerName)
            unityInstance.SendMessage(obj, 'SetRoomName', gameConfig.roomName)
            unityInstance.SendMessage(obj, 'SetRole', 'Pilot')
            unityInstance.SendMessage(obj, 'SetVehicle', 'Drone')
            unityInstance.SendMessage(obj, 'SetMap', 'Small Map')
          } catch (e) {
            // Silently continue trying other names
          }
        }
        
        // Try auto join after a delay
        setTimeout(() => {
          for (const obj of setupObjects) {
            try {
              unityInstance.SendMessage(obj, 'AutoJoinTeam', '')
              unityInstance.SendMessage(obj, 'JoinTeam', '')
              unityInstance.SendMessage(obj, 'OnJoinButtonClicked', '')
              unityInstance.SendMessage(obj, 'OnJoinTeamButtonClick', '')
            } catch (e) {
              // Continue trying
            }
          }
        }, 1000)
      }
    }, 3000)
  }

  // Cleanup Unity bridge on unmount
  useEffect(() => {
    return () => {
      if (bridgeRef.current) {
        bridgeRef.current.destroy()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          vMOUSE - Auto Play Mode
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
            Auto Configuration
          </h2>
          <div className="text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Player Name:</strong> {gameConfig.playerName}</p>
            <p><strong>Room:</strong> {gameConfig.roomName}</p>
            <p><strong>Role:</strong> {gameConfig.role}</p>
            <p><strong>Vehicle:</strong> {gameConfig.vehicle}</p>
            <p><strong>Map:</strong> {gameConfig.map}</p>
            {unityLoaded && <p className="text-green-600">✓ Game loaded - attempting auto-play</p>}
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>This page attempts to automatically fill the form and start the game.</p>
            <p>Check the browser console for debugging information.</p>
          </div>
        </div>
      </div>
    </div>
  )
}