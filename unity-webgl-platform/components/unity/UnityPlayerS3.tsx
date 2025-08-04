'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { getUrl } from 'aws-amplify/storage'
import '@/lib/amplify'

interface UnityConfig {
  dataUrl: string
  frameworkUrl: string
  codeUrl: string
  loaderUrl?: string
  streamingAssetsUrl?: string
  companyName?: string
  productName?: string
  productVersion?: string
}

interface UnityPlayerS3Props {
  config: UnityConfig
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

export default function UnityPlayerS3({
  config,
  onProgress,
  onLoaded,
  onError,
  className = ''
}: UnityPlayerS3Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const [resolvedConfig, setResolvedConfig] = useState<UnityConfig | null>(null)
  const [loaderScriptUrl, setLoaderScriptUrl] = useState<string | null>(null)
  const unityInstanceRef = useRef<any>(null)

  useEffect(() => {
    resolveS3Urls()
    return () => {
      if (unityInstanceRef.current?.Quit) {
        unityInstanceRef.current.Quit()
      }
    }
  }, [config])

  const resolveS3Urls = async () => {
    try {
      // Check if URLs are already resolved (e.g., proxy URLs starting with /api/)
      const isProxyUrl = (url: string) => url.startsWith('/api/') || url.startsWith('http')
      
      if (isProxyUrl(config.frameworkUrl)) {
        // URLs are already resolved, use them directly
        setResolvedConfig(config)
        setLoaderScriptUrl(config.loaderUrl || config.frameworkUrl)
        return
      }
      
      // Otherwise, get signed URLs from S3
      const urlPromises = [
        getUrl({ key: config.frameworkUrl }),
        getUrl({ key: config.codeUrl }),
      ]
      
      // Only add dataUrl if it's provided (some Unity builds don't have separate .data files)
      if (config.dataUrl) {
        urlPromises.unshift(getUrl({ key: config.dataUrl }))
      }
      
      if (config.loaderUrl) {
        urlPromises.push(getUrl({ key: config.loaderUrl }))
      }

      const results = await Promise.all(urlPromises)
      let resultIndex = 0

      const resolved: UnityConfig = {
        ...config,
        dataUrl: config.dataUrl ? results[resultIndex++].url.toString() : '',
        frameworkUrl: results[resultIndex++].url.toString(),
        codeUrl: results[resultIndex++].url.toString(),
        streamingAssetsUrl: config.streamingAssetsUrl ? 
          (await getUrl({ key: config.streamingAssetsUrl })).url.toString() : 
          undefined
      }

      // If loader URL is provided, use it; otherwise infer from the framework URL
      if (config.loaderUrl) {
        const loaderResult = results[resultIndex]
        setLoaderScriptUrl(loaderResult.url.toString())
      } else {
        // Infer loader URL from framework URL (replace .framework.js with .loader.js)
        const loaderKey = config.frameworkUrl.replace('.framework.js', '.loader.js')
        const loaderResult = await getUrl({ key: loaderKey })
        setLoaderScriptUrl(loaderResult.url.toString())
      }

      // Remove empty dataUrl from config if not needed
      if (!config.dataUrl) {
        delete resolved.dataUrl
      }

      setResolvedConfig(resolved)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to resolve S3 URLs')
      setError(error)
      setLoading(false)
      onError?.(error)
    }
  }

  const handleScriptLoad = async () => {
    if (!canvasRef.current || !window.createUnityInstance || !resolvedConfig) {
      return
    }

    try {
      const unityInstance = await window.createUnityInstance(
        canvasRef.current,
        resolvedConfig,
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

  if (!resolvedConfig) {
    return (
      <div className="flex items-center justify-center min-h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Preparing Unity application...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Script
        src={loaderScriptUrl || resolvedConfig.loaderUrl || resolvedConfig.frameworkUrl}
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
        id="unity-canvas"
        tabIndex={-1}
        className={`${loading ? 'invisible' : 'visible'}`}
        style={{ width: '1024px', height: '576px', background: '#231F20' }}
      />
    </div>
  )
}