'use client'

// Version 5: URL parameter support with query string parsing
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const UnityPlayerLocal = dynamic(() => import('@/components/unity/UnityPlayerLocal'), {
  ssr: false,
})

export default function UnityGamePage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const unityRef = useRef<any>(null)
  
  // Get parameters from URL
  const playerName = searchParams.get('playerName') || 'AutoPilot'
  const roomName = searchParams.get('roomName') || 'AutoRoom'
  const role = searchParams.get('role') || 'pilot'
  const vehicle = searchParams.get('vehicle') || 'drone'
  const autoStart = searchParams.get('autoStart') === 'true'

  const handleUnityLoaded = (unityInstance: any) => {
    console.log('Unity loaded - Version 5: URL parameter support')
    console.log('Parameters:', { playerName, roomName, role, vehicle, autoStart })
    setLoading(false)
    unityRef.current = unityInstance
    
    // Make Unity instance globally available
    if (typeof window !== 'undefined') {
      (window as any).unityInstance = unityInstance
      (window as any).gameConfig = { playerName, roomName, role, vehicle, autoStart }
    }
    
    if (autoStart && unityInstance && unityInstance.SendMessage) {
      // Auto-configure based on URL parameters
      setTimeout(() => {
        console.log('Auto-configuring from URL parameters...')
        
        // Set player info
        unityInstance.SendMessage('SetupUIScript', 'SetNickname', playerName)
        unityInstance.SendMessage('SetupUIScript', 'SetRoomName', roomName)
        unityInstance.SendMessage('SetupUIScript', 'SetRole', role === 'pilot' ? 'Pilot' : 'Camera')
        unityInstance.SendMessage('SetupUIScript', 'SetVehicle', vehicle === 'drone' ? 'Drone' : 'Rover')
        
        // Try multiple patterns
        unityInstance.SendMessage('PlayerNameInputField', 'set_text', playerName)
        unityInstance.SendMessage('RoomNameInputField', 'set_text', roomName)
        
        // Auto join
        setTimeout(() => {
          unityInstance.SendMessage('SetupUIScript', 'AutoJoinTeam', '')
          unityInstance.SendMessage('GameManager', 'StartGame', '')
        }, 1000)
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          vMOUSE - Version 5 (URL Parameters)
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
            Version 5 Info - URL Parameter Support
          </h2>
          <div className="text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>Player Name:</strong> {playerName}</p>
            <p><strong>Room:</strong> {roomName}</p>
            <p><strong>Role:</strong> {role}</p>
            <p><strong>Vehicle:</strong> {vehicle}</p>
            <p><strong>Auto Start:</strong> {autoStart ? 'Yes' : 'No'}</p>
            <hr className="my-4" />
            <p className="text-sm">
              Try: ?playerName=TestPilot&roomName=TestRoom&role=pilot&vehicle=drone&autoStart=true
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}