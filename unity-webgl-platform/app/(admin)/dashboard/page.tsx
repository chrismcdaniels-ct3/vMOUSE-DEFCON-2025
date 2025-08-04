'use client'

import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '@/amplify/data/resource'
import { RiGamepadLine, RiUserLine, RiBarChartLine, RiAddLine, RiExternalLinkLine } from '@remixicon/react'
import GameUploadModal from '@/components/admin/GameUploadModal'
import { remove } from 'aws-amplify/storage'
import '@/lib/amplify'

const client = generateClient<Schema>()

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalGames: 0,
    activeSessions: 0,
    totalPlays: 0,
  })
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [deletingGame, setDeletingGame] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      // Load games using GSI
      const { data: gamesData } = await client.models.Entity.list({
        filter: {
          gsi2pk: { eq: 'UNITY_PAGE' },
        },
      })

      if (gamesData) {
        setGames(gamesData)
        setStats(prev => ({ ...prev, totalGames: gamesData.length }))
      }

      // In a real app, you would also load session and analytics data
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your Unity WebGL games and view analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Games</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalGames}
              </p>
            </div>
            <RiGamepadLine className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Sessions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.activeSessions}
              </p>
            </div>
            <RiUserLine className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Plays</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalPlays}
              </p>
            </div>
            <RiBarChartLine className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Unity Games
            </h2>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <RiAddLine className="w-4 h-4" />
              Add Game
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {games.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No games added yet. Click "Add Game" to get started.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </th>
                    <th className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Slug
                    </th>
                    <th className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created
                    </th>
                    <th className="pb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.pk} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 text-gray-900 dark:text-white">
                        {game.name || 'Untitled'}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {game.slug}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          game.enabled
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {game.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(game.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <a 
                          href={`/unity/${game.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 mr-3 inline-flex items-center gap-1"
                        >
                          View
                          <RiExternalLinkLine className="w-3 h-3" />
                        </a>
                        <button 
                          onClick={() => handleToggleGame(game)}
                          className="text-yellow-500 hover:text-yellow-600 mr-3"
                        >
                          {game.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button 
                          onClick={() => handleDeleteGame(game)}
                          disabled={deletingGame === game.pk}
                          className="text-red-500 hover:text-red-600 disabled:opacity-50"
                        >
                          {deletingGame === game.pk ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <GameUploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false)
          loadDashboardData()
        }}
      />
    </div>
  )

  async function handleToggleGame(game: any) {
    try {
      await client.models.Entity.update({
        pk: game.pk,
        sk: game.sk,
        enabled: !game.enabled,
        updatedAt: new Date().toISOString(),
      })
      await loadDashboardData()
    } catch (error) {
      console.error('Error toggling game:', error)
    }
  }

  async function handleDeleteGame(game: any) {
    if (!confirm(`Are you sure you want to delete "${game.name}"? This action cannot be undone.`)) {
      return
    }

    setDeletingGame(game.pk)
    try {
      // Delete S3 files
      if (game.s3Path) {
        // List and delete all files in the game's S3 path
        // Note: This is a simplified version - in production you'd want to list and delete all files
        try {
          await remove({ key: game.s3Path })
        } catch (err) {
          console.warn('Error deleting S3 files:', err)
        }
      }

      // Delete database record
      await client.models.Entity.delete({
        pk: game.pk,
        sk: game.sk,
      })

      await loadDashboardData()
    } catch (error) {
      console.error('Error deleting game:', error)
      alert('Failed to delete game. Please try again.')
    } finally {
      setDeletingGame(null)
    }
  }
}