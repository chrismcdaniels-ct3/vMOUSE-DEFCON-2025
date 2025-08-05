'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import FlyingControls from '@/components/ui/FlyingControls'
import RoverControls from '@/components/ui/RoverControls'

const UnityPlayerLocal = dynamic(() => import('@/components/unity/UnityPlayerLocal'), {
  ssr: false,
})

export default function UnityGamePage() {
  const params = useParams()
  const gameId = params.id as string
  const [_loading, _setLoading] = useState(false)
  
  // S3 Configuration
  const useS3 = process.env.NEXT_PUBLIC_UNITY_USE_S3 === 'true'
  const s3BaseUrl = process.env.NEXT_PUBLIC_UNITY_CDN_URL || process.env.NEXT_PUBLIC_UNITY_BASE_URL || ''

  const handleUnityLoaded = (unityInstance: any) => {
    console.log('Unity game loaded successfully')
    _setLoading(false)
    
    // Make Unity instance globally available
    if (typeof window !== 'undefined') {
      (window as any).unityInstance = unityInstance
    }
    
    // Try automation with defcon_vmouse specific patterns
    setTimeout(() => {
      if (unityInstance && unityInstance.SendMessage) {
        console.log('Setting up game configuration...')
        
        // Based on the symbols found in defcon builds
        unityInstance.SendMessage('Player', 'SetPlayerNameProperty', 'AutoPilot')
        unityInstance.SendMessage('GameManager', 'StartGame', '')
        
        // Handle both drone and rover
        if (gameId === 'vmouse') {
          unityInstance.SendMessage('DroneSelection', 'RefreshSelection', '')
        } else if (gameId === 'vrover') {
          unityInstance.SendMessage('RoverSelection', 'RefreshSelection', '')
        }
        
        unityInstance.SendMessage('LobbyMainPanel', 'OnStartGameButtonClicked', '')
        
        // Standard attempts
        unityInstance.SendMessage('SetupUIScript', 'SetNickname', 'AutoPilot')
        unityInstance.SendMessage('SetupUIScript', 'SetRoomName', gameId === 'vmouse' ? 'DroneRoom' : 'RoverRoom')
        unityInstance.SendMessage('SetupUIScript', 'AutoJoinTeam', '')
      }
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className={`absolute inset-0 bg-gradient-to-br ${
          gameId === 'vmouse' 
            ? 'from-gray-900/30 via-black to-orange-900/10' 
            : 'from-gray-900/30 via-black to-orange-900/10'
        }`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-800/10 via-transparent to-transparent" />
        
        {/* Animated orb */}
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${
          gameId === 'vmouse' ? 'bg-orange-600' : 'bg-orange-600'
        } rounded-full filter blur-[128px] opacity-20 animate-pulse`} />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            <span className={`bg-clip-text text-transparent bg-gradient-to-r ${
              gameId === 'vmouse' 
                ? 'from-orange-400 to-gray-400' 
                : 'from-orange-400 to-gray-400'
            }`}>
              {gameId === 'vmouse' ? 'vMOUSE Drone' : 'vMOUSE Rover'}
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            {gameId === 'vmouse' 
              ? 'Precision Drone Piloting Experience' 
              : 'Advanced Rover Control System'}
          </p>
        </div>
        
        {/* Game Container */}
        <div className={`bg-gradient-to-br ${
          gameId === 'vmouse' 
            ? 'from-gray-900/40 to-gray-800/30' 
            : 'from-gray-900/40 to-gray-800/30'
        } backdrop-blur-xl rounded-3xl p-6 border ${
          gameId === 'vmouse' 
            ? 'border-orange-500/20' 
            : 'border-orange-500/20'
        } shadow-2xl animate-fade-in animation-delay-1000`}>
          {gameId === 'vmouse' ? (
            <UnityPlayerLocal
              gameName="defcon_drone"
              buildPath="/api/unity-gz"
              useS3={useS3}
              s3BaseUrl={s3BaseUrl}
              config={useS3 ? {
                dataUrl: `${s3BaseUrl}/defcon_drone/Build/defcon_drone.data.gz`,
                frameworkUrl: `${s3BaseUrl}/defcon_drone/Build/defcon_drone.framework.js.gz`,
                codeUrl: `${s3BaseUrl}/defcon_drone/Build/defcon_drone.wasm.gz`,
                loaderUrl: `${s3BaseUrl}/defcon_drone/Build/defcon_drone.loader.js`,
                streamingAssetsUrl: `${s3BaseUrl}/defcon_drone/StreamingAssets`,
                companyName: 'CTCubed',
                productName: 'vMOUSE',
                productVersion: '0.1'
              } : {
                dataUrl: '/api/unity-gz/Build/defcon_drone.data.gz',
                frameworkUrl: '/api/unity-gz/Build/defcon_drone.framework.js.gz',
                codeUrl: '/api/unity-gz/Build/defcon_drone.wasm.gz',
                loaderUrl: '/api/unity-gz/Build/defcon_drone.loader.js',
                streamingAssetsUrl: '/api/unity-gz/StreamingAssets',
                companyName: 'CTCubed',
                productName: 'vMOUSE',
                productVersion: '0.1'
              }}
              className="w-full flex justify-center"
              onLoaded={handleUnityLoaded}
              onError={(error) => {
                console.error('Unity error:', error)
              }}
              onProgress={(progress) => {
                console.log('Loading progress:', progress)
              }}
            />
          ) : (
            <UnityPlayerLocal
              gameName="defcon_rover"
              buildPath="/defcon_rover"
              useS3={useS3}
              s3BaseUrl={s3BaseUrl}
              config={useS3 ? {
                dataUrl: `${s3BaseUrl}/defcon_rover/Build/defcon_rover.data`,
                frameworkUrl: `${s3BaseUrl}/defcon_rover/Build/defcon_rover.framework.js`,
                codeUrl: `${s3BaseUrl}/defcon_rover/Build/defcon_rover.wasm`,
                loaderUrl: `${s3BaseUrl}/defcon_rover/Build/defcon_rover.loader.js`,
                streamingAssetsUrl: `${s3BaseUrl}/defcon_rover/StreamingAssets`,
                companyName: 'CTCubed',
                productName: 'vMOUSE Rover',
                productVersion: '0.1'
              } : undefined}
              className="w-full flex justify-center"
              onLoaded={handleUnityLoaded}
              onError={(error) => {
                console.error('Unity error:', error)
              }}
              onProgress={(progress) => {
                console.log('Loading progress:', progress)
              }}
            />
          )}
        </div>

        {/* Controls - Different for each game type */}
        {gameId === 'vmouse' ? (
          <div className="mt-8">
            <FlyingControls className="animate-fade-in animation-delay-2000" />
          </div>
        ) : (
          <div className="mt-8">
            <RoverControls className="animate-fade-in animation-delay-2000" />
          </div>
        )}

        {/* Game Information */}
        <div className={`mt-8 bg-gradient-to-br ${
          gameId === 'vmouse' 
            ? 'from-gray-900/40 to-gray-800/30' 
            : 'from-gray-900/40 to-gray-800/30'
        } backdrop-blur-xl rounded-3xl p-6 border ${
          gameId === 'vmouse' 
            ? 'border-orange-500/20' 
            : 'border-orange-500/20'
        } shadow-2xl animate-fade-in animation-delay-3000`}>
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Game Information
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className={`text-sm font-medium ${
                gameId === 'vmouse' ? 'text-orange-400' : 'text-orange-400'
              }`}>Platform</h3>
              <p className="text-gray-300">Unity WebGL Platform</p>
            </div>
            <div>
              <h3 className={`text-sm font-medium ${
                gameId === 'vmouse' ? 'text-orange-400' : 'text-orange-400'
              }`}>Version</h3>
              <p className="text-gray-300">DEF CON Edition 2025.v0.1</p>
            </div>
            <div>
              <h3 className={`text-sm font-medium ${
                gameId === 'vmouse' ? 'text-orange-400' : 'text-orange-400'
              }`}>Mode</h3>
              <p className="text-gray-300">CTF Single Player</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center animate-fade-in animation-delay-4000">
          <Link 
            href="/" 
            className={`inline-flex items-center text-sm ${
              gameId === 'vmouse' ? 'text-orange-400 hover:text-orange-300' : 'text-orange-400 hover:text-orange-300'
            } transition-colors`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}