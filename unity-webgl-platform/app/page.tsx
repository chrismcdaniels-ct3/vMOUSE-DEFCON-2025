'use client'

import Link from 'next/link'
import { RiGamepadLine, RiDashboardLine, RiShieldLine } from '@remixicon/react'
import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '@/amplify/data/resource'
import '@/lib/amplify'

const client = generateClient<Schema>()

export default function Home() {
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGames()
  }, [])

  async function loadGames() {
    try {
      const { data } = await client.models.Entity.list({
        filter: {
          gsi2pk: { eq: 'UNITY_PAGE' },
          enabled: { eq: true },
        },
      })
      
      if (data) {
        setGames(data)
      }
    } catch (error) {
      console.error('Error loading games:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Unity WebGL Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Host and manage your Unity WebGL applications with ease
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <RiGamepadLine className="w-12 h-12 text-blue-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
              Play Games
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Access and play Unity WebGL games directly in your browser
            </p>
            {games.length > 0 ? (
              <Link
                href={`/unity/${games[0].slug}`}
                className="inline-flex items-center text-blue-500 hover:text-blue-600"
              >
                Play {games[0].name} →
              </Link>
            ) : (
              <span className="text-gray-500 dark:text-gray-500">
                {loading ? 'Loading...' : 'No games available'}
              </span>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <RiDashboardLine className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
              Analytics
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Track player engagement and game performance metrics
            </p>
            <div className="text-gray-500 dark:text-gray-500">
              Login required
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <RiShieldLine className="w-12 h-12 text-purple-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
              Admin Panel
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage games, users, and platform settings
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-purple-500 hover:text-purple-600"
            >
              Go to Dashboard →
            </Link>
          </div>
        </div>

        {/* Available Games Section */}
        {games.length > 0 && (
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
              Available Games
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <Link
                  key={game.pk}
                  href={`/unity/${game.slug}`}
                  className="group block bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <RiGamepadLine className="w-8 h-8 text-blue-500 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-500">
                    {game.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    /unity/{game.slug}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Platform Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Easy Deployment
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Upload Unity WebGL builds and deploy them instantly with AWS Amplify
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Real-time Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor player sessions, game events, and performance metrics
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Secure Hosting
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enterprise-grade security with AWS infrastructure
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Scalable Architecture
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Handle thousands of concurrent players with auto-scaling
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}