'use client'

import dynamic from 'next/dynamic'

const UnityPlayerLocal = dynamic(() => import('@/components/unity/UnityPlayerLocal'), {
  ssr: false,
})

export default function TestVMousePage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Defcon vMouse Test
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <UnityPlayerLocal
            gameName="defcon_vmouse"
            buildPath="/unity-builds/defcon_vmouse"
            className="w-full flex justify-center"
            onLoaded={() => {
              console.log('Unity vMouse loaded successfully')
            }}
            onError={(error) => {
              console.error('Unity vMouse error:', error)
              console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
              })
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
            This is a test page for the defcon_vmouse Unity WebGL build.
          </p>
        </div>
      </div>
    </div>
  )
}