'use client'

// Version 2: Direct Unity loading with immediate automation attempts
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const UnityPlayerLocal = dynamic(() => import('@/components/unity/UnityPlayerLocal'), {
  ssr: false,
})

export default function UnityGamePage() {
  const [loading, setLoading] = useState(false)

  const handleUnityLoaded = (unityInstance: any) => {
    console.log('Unity loaded - Version 2: Immediate automation')
    setLoading(false)
    
    // Make Unity instance globally available
    if (typeof window !== 'undefined') {
      (window as any).unityInstance = unityInstance
    }
    
    // Immediate automation - no delay
    if (unityInstance && unityInstance.SendMessage) {
      // Direct attempts based on common Unity patterns
      const immediateSetup = () => {
        // Set player info
        unityInstance.SendMessage('SetupUIScript', 'SetNickname', 'AutoPilot')
        unityInstance.SendMessage('SetupUIScript', 'SetRoomName', 'AutoRoom')
        unityInstance.SendMessage('SetupUIScript', 'SetRole', 'Pilot')
        unityInstance.SendMessage('SetupUIScript', 'SetVehicle', 'Drone')
        unityInstance.SendMessage('SetupUIScript', 'SetMap', 'Small Map')
        
        // Try direct game start
        unityInstance.SendMessage('SetupUIScript', 'AutoJoinTeam', '')
        unityInstance.SendMessage('GameManager', 'StartGame', '')
        
        // Alternative approaches
        unityInstance.SendMessage('NetworkManager', 'SetNickname', 'AutoPilot')
        unityInstance.SendMessage('NetworkManager', 'JoinRoom', 'AutoRoom')
        unityInstance.SendMessage('PhotonManager', 'JoinRoom', 'AutoRoom')
      }
      
      immediateSetup()
      
      // Retry after 1 second
      setTimeout(immediateSetup, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          vMOUSE - Version 2 (Immediate Automation)
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
            Version 2 Info
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This version attempts immediate automation without delays.
          </p>
        </div>
      </div>
    </div>
  )
}