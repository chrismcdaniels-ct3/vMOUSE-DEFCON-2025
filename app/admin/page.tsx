'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

interface S3File {
  key: string
  size: number
  lastModified: Date
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [files, setFiles] = useState<S3File[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedGame, setSelectedGame] = useState<'drone' | 'rover'>('drone')

  const loadFiles = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/s3/list?prefix=defcon_${selectedGame}/`)
      const data = await response.json()
      setFiles(data.files || [])
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedGame])

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/admin/login')
    } else {
      loadFiles()
    }
  }, [session, status, router, loadFiles])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('game', selectedGame)

    try {
      const response = await fetch('/api/admin/s3/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await loadFiles()
        alert('File uploaded successfully')
      } else {
        alert('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete ${key}?`)) return

    try {
      const response = await fetch('/api/admin/s3/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })

      if (response.ok) {
        await loadFiles()
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-black to-orange-900/20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-gray-400">
              Admin Panel
            </span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Welcome, {session.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Game Selector */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => { setSelectedGame('drone'); loadFiles(); }}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              selectedGame === 'drone'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            vMOUSE Drone
          </button>
          <button
            onClick={() => { setSelectedGame('rover'); loadFiles(); }}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              selectedGame === 'rover'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            vMOUSE Rover
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-3xl p-6 border border-orange-500/20 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Upload Files</h2>
          <div className="space-y-4">
            <p className="text-gray-400">
              Upload Unity WebGL build files for {selectedGame === 'drone' ? 'vMOUSE Drone' : 'vMOUSE Rover'}
            </p>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              accept=".data,.gz,.js,.wasm,.json"
              className="block w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-600 file:text-white hover:file:bg-orange-700"
            />
            {uploading && <p className="text-orange-400">Uploading...</p>}
          </div>
        </div>

        {/* Files List */}
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-xl rounded-3xl p-6 border border-orange-500/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-4">Current Files</h2>
          <div className="space-y-2">
            {files.length === 0 ? (
              <p className="text-gray-400">No files found</p>
            ) : (
              files.map(file => (
                <div key={file.key} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{file.key}</p>
                    <p className="text-gray-400 text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB - {new Date(file.lastModified).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(file.key)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}