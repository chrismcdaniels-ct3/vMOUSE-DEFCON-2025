'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const UnityPlayerLocal = dynamic(() => import('@/components/unity/UnityPlayerLocal'), {
  ssr: false,
})

export default function UnityRoverPage() {
  const [loading, setLoading] = useState(false)

  const handleUnityLoaded = (unityInstance: any) => {
    console.log('Unity rover game loaded successfully')
    setLoading(false)
    
    // Make Unity instance globally available
    if (typeof window !== 'undefined') {
      (window as any).unityInstance = unityInstance
    }
    
    // Try automation with defcon_rover specific patterns
    setTimeout(() => {
      if (unityInstance && unityInstance.SendMessage) {
        console.log('Setting up rover game configuration...')
        
        // Based on the patterns from defcon_vmouse that worked
        unityInstance.SendMessage('Player', 'SetPlayerNameProperty', 'AutoPilot')
        unityInstance.SendMessage('GameManager', 'StartGame', '')
        unityInstance.SendMessage('RoverSelection', 'RefreshSelection', '')
        unityInstance.SendMessage('LobbyMainPanel', 'OnStartGameButtonClicked', '')
        
        // Standard attempts
        unityInstance.SendMessage('SetupUIScript', 'SetNickname', 'AutoPilot')
        unityInstance.SendMessage('SetupUIScript', 'SetRoomName', 'RoverRoom')
        unityInstance.SendMessage('SetupUIScript', 'AutoJoinTeam', '')
      }
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          vROVER
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <UnityPlayerLocal
            gameName="defcon_rover"
            buildPath="/defcon_rover"
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
            Game Information
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            DEF CON vROVER - Unity WebGL Platform
          </p>
        </div>
      </div>
    </div>
  )
}