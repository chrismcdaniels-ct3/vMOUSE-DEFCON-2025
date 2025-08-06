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
    _setLoading(false)
    
    // Make Unity instance globally available for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).unityInstance = unityInstance
    }
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
                // Handle error silently in production
                if (process.env.NODE_ENV === 'development') {
                  console.error('Unity error:', error)
                }
              }}
              onProgress={(progress) => {
                // Progress handled silently
                void progress
              }}
            />
          ) : (
            <UnityPlayerLocal
              gameName="defcon_rover"
              buildPath="/defcon_rover"
              useS3={useS3}
              s3BaseUrl={s3BaseUrl}
              config={useS3 ? {
                dataUrl: `${s3BaseUrl}/defcon_rover/Build/defcon_rover.data.gz`,
                frameworkUrl: `${s3BaseUrl}/defcon_rover/Build/defcon_rover.framework.js.gz`,
                codeUrl: `${s3BaseUrl}/defcon_rover/Build/defcon_rover.wasm.gz`,
                loaderUrl: `${s3BaseUrl}/defcon_rover/Build/defcon_rover.loader.js`,
                streamingAssetsUrl: `${s3BaseUrl}/defcon_rover/StreamingAssets`,
                companyName: 'CTCubed',
                productName: 'vMOUSE Rover',
                productVersion: '0.1'
              } : undefined}
              className="w-full flex justify-center"
              onLoaded={handleUnityLoaded}
              onError={(error) => {
                // Handle error silently in production
                if (process.env.NODE_ENV === 'development') {
                  console.error('Unity error:', error)
                }
              }}
              onProgress={(progress) => {
                // Progress handled silently
                void progress
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