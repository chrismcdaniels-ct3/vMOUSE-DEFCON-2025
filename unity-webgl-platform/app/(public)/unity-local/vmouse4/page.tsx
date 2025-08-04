'use client'

// Version 4: Direct input field manipulation pattern
import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'

const UnityPlayerLocal = dynamic(() => import('@/components/unity/UnityPlayerLocal'), {
  ssr: false,
})

export default function UnityGamePage() {
  const [loading, setLoading] = useState(false)
  const unityRef = useRef<any>(null)

  const handleUnityLoaded = (unityInstance: any) => {
    console.log('Unity loaded - Version 4: Direct input field pattern')
    setLoading(false)
    unityRef.current = unityInstance
    
    // Make Unity instance globally available
    if (typeof window !== 'undefined') {
      (window as any).unityInstance = unityInstance
    }
    
    // Try direct input field manipulation after short delay
    setTimeout(() => {
      if (unityInstance && unityInstance.SendMessage) {
        console.log('Attempting direct input field manipulation...')
        
        // Try TMP InputField patterns
        unityInstance.SendMessage('PlayerNameInputField', 'set_text', 'AutoPilot')
        unityInstance.SendMessage('RoomNameInputField', 'set_text', 'AutoRoom')
        
        // Try alternative naming patterns
        unityInstance.SendMessage('PlayerNameInput', 'set_text', 'AutoPilot')
        unityInstance.SendMessage('RoomNameInput', 'set_text', 'AutoRoom')
        
        // Try with TMP prefix
        unityInstance.SendMessage('TMP_PlayerNameInputField', 'set_text', 'AutoPilot')
        unityInstance.SendMessage('TMP_RoomNameInputField', 'set_text', 'AutoRoom')
        
        // After setting text, try button clicks
        setTimeout(() => {
          console.log('Clicking buttons...')
          
          // Select Pilot
          unityInstance.SendMessage('SelectPilotButton', 'OnClick', '')
          unityInstance.SendMessage('PilotButton', 'OnClick', '')
          
          // Select Small Map
          unityInstance.SendMessage('SmallMapButton', 'OnClick', '')
          
          // Select Drone
          unityInstance.SendMessage('DroneButton', 'OnClick', '')
          
          // Join Team
          setTimeout(() => {
            unityInstance.SendMessage('JoinTeamButton', 'OnClick', '')
            unityInstance.SendMessage('JoinButton', 'OnClick', '')
          }, 500)
        }, 1000)
      }
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          vMOUSE - Version 4 (Input Field Pattern)
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
            Version 4 Info
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Direct TMP InputField manipulation with button clicks.
          </p>
        </div>
      </div>
    </div>
  )
}