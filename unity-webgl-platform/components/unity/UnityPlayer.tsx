'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface UnityConfig {
  dataUrl: string
  frameworkUrl: string
  codeUrl: string
  streamingAssetsUrl?: string
  companyName?: string
  productName?: string
  productVersion?: string
}

interface UnityPlayerProps {
  buildPath: string
  config?: Partial<UnityConfig>
  onProgress?: (progress: number) => void
  onLoaded?: () => void
  onError?: (error: Error) => void
  className?: string
}

declare global {
  interface Window {
    createUnityInstance: (
      canvas: HTMLCanvasElement,
      config: UnityConfig,
      onProgress?: (progress: number) => void
    ) => Promise<any>
  }
}

export default function UnityPlayer({
  buildPath,
  config = {},
  onProgress,
  onLoaded,
  onError,
  className = ''
}: UnityPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const unityInstanceRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      // Cleanup Unity instance on unmount
      if (unityInstanceRef.current?.Quit) {
        unityInstanceRef.current.Quit()
      }
    }
  }, [])

  const handleScriptLoad = async () => {
    if (!canvasRef.current || !window.createUnityInstance) {
      return
    }

    const defaultConfig: UnityConfig = {
      dataUrl: `${buildPath}/Build.data`,
      frameworkUrl: `${buildPath}/Build.framework.js`,
      codeUrl: `${buildPath}/Build.wasm`,
      streamingAssetsUrl: `${buildPath}/StreamingAssets`,
      companyName: 'DefaultCompany',
      productName: 'UnityWebGL',
      productVersion: '1.0',
      ...config
    }

    try {
      const unityInstance = await window.createUnityInstance(
        canvasRef.current,
        defaultConfig,
        (p: number) => {
          setProgress(p)
          onProgress?.(p)
        }
      )

      unityInstanceRef.current = unityInstance
      setLoading(false)
      onLoaded?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load Unity')
      setError(error)
      setLoading(false)
      onError?.(error)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load Unity application</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Script
        src={`${buildPath}/Build.loader.js`}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={(e) => {
          const error = new Error('Failed to load Unity loader script')
          setError(error)
          setLoading(false)
          onError?.(error)
        }}
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading Unity application... {Math.round(progress * 100)}%
            </p>
            <div className="mt-2 w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${loading ? 'invisible' : 'visible'}`}
        style={{ width: '100%', height: '600px' }}
      />
    </div>
  )
}