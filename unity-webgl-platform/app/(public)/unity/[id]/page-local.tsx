'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const UnityPlayerLocal = dynamic(() => import('@/components/unity/UnityPlayerLocal'), {
  ssr: false,
})

export default function UnityGamePage() {
  const params = useParams()
  const [loading, setLoading] = useState(false)

  // For now, just support the vmouse game
  if (params.id !== 'vmouse') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Game not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The requested game could not be loaded.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          vMOUSE
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <UnityPlayerLocal
            gameName="vMOUSE_builds"
            buildPath="/unity-builds/vmouse"
            className="w-full flex justify-center"
            onLoaded={() => {
              console.log('Unity game loaded!')
              setLoading(false)
            }}
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
            This Unity WebGL game is served from local files for testing.
          </p>
        </div>
      </div>
    </div>
  )
}