'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface UnityConfig {
  dataUrl?: string
  frameworkUrl: string
  codeUrl: string
  symbolsUrl?: string
  streamingAssetsUrl?: string
  companyName?: string
  productName?: string
  productVersion?: string
}

interface UnityPlayerLocalProps {
  gameName: string
  buildPath: string
  config?: Partial<UnityConfig>
  onProgress?: (progress: number) => void
  onLoaded?: (unityInstance: any) => void
  onError?: (error: Error) => void
  className?: string
  canvasStyle?: React.CSSProperties
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

export default function UnityPlayerLocal({
  gameName,
  buildPath,
  config = {},
  onProgress,
  onLoaded,
  onError,
  className = '',
  canvasStyle = {}
}: UnityPlayerLocalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const unityInstanceRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (unityInstanceRef.current?.Quit) {
        unityInstanceRef.current.Quit()
      }
    }
  }, [])

  const handleScriptLoad = async () => {
    console.log('Unity loader script loaded, initializing Unity...')
    
    if (!canvasRef.current) {
      console.error('Canvas element not found')
      setError(new Error('Canvas element not found'))
      setLoading(false)
      return
    }
    
    if (!window.createUnityInstance) {
      console.error('createUnityInstance not found on window')
      setError(new Error('Unity loader not properly loaded'))
      setLoading(false)
      return
    }

    const buildFolder = `${buildPath}/Build`
    const defaultConfig: UnityConfig = {
      dataUrl: `${buildFolder}/${gameName}.data`,
      frameworkUrl: `${buildFolder}/${gameName}.framework.js`,
      codeUrl: `${buildFolder}/${gameName}.wasm`,
      symbolsUrl: `${buildFolder}/${gameName}.symbols.json`,
      streamingAssetsUrl: `${buildPath}/StreamingAssets`,
      companyName: 'CTCubed',
      productName: 'vMouse',
      productVersion: '0.1',
      ...config
    }

    console.log('Unity config:', defaultConfig)

    try {
      const unityInstance = await window.createUnityInstance(
        canvasRef.current,
        defaultConfig,
        (p: number) => {
          console.log('Unity loading progress:', p)
          setProgress(p)
          onProgress?.(p)
        }
      )

      console.log('Unity instance created successfully')
      unityInstanceRef.current = unityInstance
      setLoading(false)
      onLoaded?.(unityInstance)
    } catch (err) {
      console.error('Failed to create Unity instance:', err)
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

  const defaultCanvasStyle: React.CSSProperties = {
    width: '1024px',
    height: '576px',
    background: '#231F20',
    ...canvasStyle
  }

  return (
    <div className={`relative ${className}`}>
      <Script
        src={config?.loaderUrl || `${buildPath}/Build/${gameName}.loader.js`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log(`Unity loader script loaded from: ${config?.loaderUrl || `${buildPath}/Build/${gameName}.loader.js`}`)
          handleScriptLoad()
        }}
        onError={(e) => {
          console.error(`Failed to load Unity loader script from: ${config?.loaderUrl || `${buildPath}/Build/${gameName}.loader.js`}`, e)
          const error = new Error(`Failed to load Unity loader script: ${config?.loaderUrl || `${buildPath}/Build/${gameName}.loader.js`}`)
          setError(error)
          setLoading(false)
          onError?.(error)
        }}
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg" style={{ minHeight: defaultCanvasStyle.height }}>
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
        id="unity-canvas"
        tabIndex={-1}
        className={`${loading ? 'invisible' : 'visible'}`}
        style={defaultCanvasStyle}
      />
    </div>
  )
}