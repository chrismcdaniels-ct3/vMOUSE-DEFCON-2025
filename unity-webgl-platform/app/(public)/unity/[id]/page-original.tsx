'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '@/amplify/data/resource'
import '@/lib/amplify'

const UnityPlayerS3 = dynamic(() => import('@/components/unity/UnityPlayerS3'), {
  ssr: false,
})

const client = generateClient<Schema>()

interface UnityPage {
  id: string
  name: string
  slug: string
  s3Path: string
  config?: any
  enabled: boolean
}

export default function UnityGamePage() {
  const params = useParams()
  const [page, setPage] = useState<UnityPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPage() {
      try {
        const { data } = await client.models.Entity.list({
          filter: {
            gsi2pk: { eq: 'UNITY_PAGE' },
            gsi2sk: { eq: params.id as string },
            enabled: { eq: true },
          },
        })

        if (data && data.length > 0) {
          const pageData = data[0]
          setPage({
            id: pageData.pk,
            name: pageData.name || 'Unity Game',
            slug: pageData.slug || '',
            s3Path: pageData.s3Path || '',
            config: pageData.config ? JSON.parse(pageData.config) : null,
            enabled: pageData.enabled || false,
          })
        } else {
          setError('Game not found')
        }
      } catch (err) {
        console.error('Error loading page:', err)
        setError('Failed to load game')
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading game...</p>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Game not found'}
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
          {page.name}
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          {page.config ? (
            <UnityPlayerS3
              config={page.config}
              className="w-full"
              onLoaded={() => {
                // Track game loaded event
                console.log('Unity game loaded')
              }}
              onError={(error) => {
                console.error('Unity error:', error)
                setError('Failed to load Unity application')
              }}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                Game configuration not found. Please contact the administrator.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Game Controls
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Use keyboard and mouse to interact with the game. Specific controls depend on the game implementation.
          </p>
        </div>
      </div>
    </div>
  )
}