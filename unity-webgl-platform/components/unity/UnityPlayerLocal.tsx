'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

import type { UnityConfig } from '@/types/unity'

interface UnityPlayerLocalProps {
  gameName: string
  buildPath: string
  config?: Partial<UnityConfig>
  onProgress?: (progress: number) => void
  onLoaded?: (unityInstance: any) => void
  onError?: (error: Error) => void
  className?: string
  canvasStyle?: React.CSSProperties
  useS3?: boolean
  s3BaseUrl?: string
}

export default function UnityPlayerLocal({
  gameName,
  buildPath,
  config = {},
  onProgress,
  onLoaded,
  onError,
  className = '',
  canvasStyle = {},
  useS3 = false,
  s3BaseUrl
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

    const baseUrl = useS3 && s3BaseUrl ? s3BaseUrl : ''
    const buildFolder = useS3 ? `${baseUrl}/${gameName}/Build` : `${buildPath}/Build`
    const streamingUrl = useS3 ? `${baseUrl}/${gameName}/StreamingAssets` : `${buildPath}/StreamingAssets`
    
    const defaultConfig: UnityConfig = {
      dataUrl: config.dataUrl || `${buildFolder}/${gameName}.data`,
      frameworkUrl: config.frameworkUrl || `${buildFolder}/${gameName}.framework.js`,
      codeUrl: config.codeUrl || `${buildFolder}/${gameName}.wasm`,
      symbolsUrl: config.symbolsUrl || `${buildFolder}/${gameName}.symbols.json`,
      streamingAssetsUrl: config.streamingAssetsUrl || streamingUrl,
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
        src={config?.loaderUrl || (useS3 ? `${baseUrl}/${gameName}/Build/${gameName}.loader.js` : `${buildPath}/Build/${gameName}.loader.js`)}
        strategy="afterInteractive"
        onLoad={() => {
          const loaderUrl = config?.loaderUrl || (useS3 ? `${baseUrl}/${gameName}/Build/${gameName}.loader.js` : `${buildPath}/Build/${gameName}.loader.js`)
          console.log(`Unity loader script loaded from: ${loaderUrl}`)
          handleScriptLoad()
        }}
        onError={(e) => {
          const loaderUrl = config?.loaderUrl || (useS3 ? `${baseUrl}/${gameName}/Build/${gameName}.loader.js` : `${buildPath}/Build/${gameName}.loader.js`)
          console.error(`Failed to load Unity loader script from: ${loaderUrl}`, e)
          const error = new Error(`Failed to load Unity loader script: ${loaderUrl}`)
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