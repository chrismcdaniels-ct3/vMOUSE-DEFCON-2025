'use client'

// Version 6: Minimal approach - just load Unity with no React wrapper complexity
import { useEffect } from 'react'

export default function UnityGamePage() {
  useEffect(() => {
    // Direct Unity loading approach
    const script = document.createElement('script')
    script.src = '/unity-builds/vmouse/Build/vMOUSE_builds.loader.js'
    script.onload = () => {
      console.log('Unity loader loaded - Version 6: Minimal approach')
      
      const canvas = document.querySelector('#unity-canvas') as HTMLCanvasElement
      if (canvas && (window as any).createUnityInstance) {
        const config = {
          dataUrl: '/unity-builds/vmouse/Build/vMOUSE_builds.data',
          frameworkUrl: '/unity-builds/vmouse/Build/vMOUSE_builds.framework.js',
          codeUrl: '/unity-builds/vmouse/Build/vMOUSE_builds.wasm',
          streamingAssetsUrl: '/unity-builds/vmouse/StreamingAssets',
          companyName: 'CTCubed',
          productName: 'vMOUSE',
          productVersion: '1.0',
        }
        
        ;(window as any).createUnityInstance(canvas, config, (progress: number) => {
          console.log('Loading progress:', progress)
        }).then((unityInstance: any) => {
          console.log('Unity instance created!')
          ;(window as any).unityInstance = unityInstance
          
          // Simple direct automation
          setTimeout(() => {
            console.log('Direct automation attempt...')
            unityInstance.SendMessage('SetupUIScript', 'SetNickname', 'AutoPilot')
            unityInstance.SendMessage('SetupUIScript', 'SetRoomName', 'AutoRoom')
            unityInstance.SendMessage('SetupUIScript', 'AutoJoinTeam', '')
          }, 3000)
        })
      }
    }
    document.body.appendChild(script)
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          vMOUSE - Version 6 (Minimal)
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <div id="unity-container" className="w-full flex justify-center">
            <canvas 
              id="unity-canvas" 
              width="1024" 
              height="576"
              style={{ background: '#000' }}
            />
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Version 6 Info
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Minimal Unity loading without React component wrapper.
          </p>
        </div>
      </div>
    </div>
  )
}