'use client'

// Version 3: Using Unity Bridge pattern from page-auto.tsx
import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { UnityBridge } from '@/lib/unity-bridge'

const UnityPlayerLocal = dynamic(() => import('@/components/unity/UnityPlayerLocal'), {
  ssr: false,
})

export default function UnityGamePage() {
  const [loading, setLoading] = useState(false)
  const [unityLoaded, setUnityLoaded] = useState(false)
  const bridgeRef = useRef<UnityBridge | null>(null)

  const handleUnityLoaded = (unityInstance: any) => {
    console.log('Unity loaded - Version 3: Unity Bridge pattern')
    setLoading(false)
    setUnityLoaded(true)
    
    // Create Unity bridge
    const bridge = new UnityBridge(unityInstance)
    bridgeRef.current = bridge
    
    // Make available globally
    if (typeof window !== 'undefined') {
      (window as any).unityInstance = unityInstance
      (window as any).unityBridge = bridge
    }
    
    // Wait 2 seconds then send configuration
    setTimeout(() => {
      console.log('Sending configuration via Unity Bridge...')
      
      // Send configuration using bridge
      bridge.sendToUnity('SetupUIScript', 'SetNickname', 'AutoPilot')
      bridge.sendToUnity('SetupUIScript', 'SetRoomName', 'AutoRoom')
      bridge.sendToUnity('SetupUIScript', 'SetRole', 'Pilot')
      bridge.sendToUnity('SetupUIScript', 'SetVehicle', 'Drone')
      
      // Auto join after setup
      setTimeout(() => {
        console.log('Auto joining team...')
        bridge.sendToUnity('SetupUIScript', 'AutoJoinTeam', '')
      }, 1000)
    }, 2000)
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
          vMOUSE - Version 3 (Unity Bridge)
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
            Version 3 Info
          </h2>
          <div className="text-gray-600 dark:text-gray-400 space-y-2">
            <p>Uses Unity Bridge for communication</p>
            <p>2 second delay before configuration</p>
            <p>Auto-join after 3 seconds total</p>
            {unityLoaded && <p className="text-green-600">✓ Unity Bridge active</p>}
          </div>
        </div>
      </div>
    </div>
  )
}