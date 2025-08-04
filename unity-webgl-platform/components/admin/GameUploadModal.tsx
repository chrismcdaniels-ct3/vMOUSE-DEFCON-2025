'use client'

import { useState, useRef } from 'react'
import { uploadData } from 'aws-amplify/storage'
import { generateClient } from 'aws-amplify/data'
import { fetchAuthSession } from 'aws-amplify/auth'
import type { Schema } from '@/amplify/data/resource'
import { RiCloseLine, RiUploadCloud2Line } from '@remixicon/react'
import '@/lib/amplify'

const client = generateClient<Schema>()

interface GameUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface UploadFile {
  file: File
  path: string
}

export default function GameUploadModal({ isOpen, onClose, onSuccess }: GameUploadModalProps) {
  const [gameName, setGameName] = useState('')
  const [gameSlug, setGameSlug] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const newFiles: UploadFile[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      // Extract the path from the filename if it contains directory info
      let path = file.name
      
      // Common Unity WebGL build patterns
      if (file.name.includes('Build/')) {
        path = file.name.substring(file.name.indexOf('Build/'))
      } else if (file.name.includes('TemplateData/')) {
        path = file.name.substring(file.name.indexOf('TemplateData/'))
      } else if (file.name.endsWith('.loader.js') || 
                 file.name.endsWith('.data') || 
                 file.name.endsWith('.framework.js') || 
                 file.name.endsWith('.wasm')) {
        path = `Build/${file.name}`
      }
      
      newFiles.push({ file, path })
    }

    setFiles(newFiles)
    setError('')
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setGameName(name)
    if (!gameSlug) {
      setGameSlug(generateSlug(name))
    }
  }

  const handleUpload = async () => {
    if (!gameName || !gameSlug || files.length === 0) {
      setError('Please fill in all fields and select Unity build files')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError('')

    try {
      // Check authentication - force refresh to get latest tokens
      const session = await fetchAuthSession({ forceRefresh: true })
      console.log('Auth session:', { 
        hasTokens: !!session.tokens,
        hasCredentials: !!session.credentials,
        identityId: session.identityId 
      })
      
      if (!session.tokens) {
        throw new Error('Not authenticated. Please sign in again.')
      }
      
      // Log token details for debugging
      if (session.tokens?.accessToken) {
        try {
          const payload = JSON.parse(
            atob(session.tokens.accessToken.toString().split('.')[1])
          )
          console.log('User groups:', payload['cognito:groups'])
        } catch (e) {
          console.error('Error parsing token:', e)
        }
      }
      // Create game record first
      const gameId = crypto.randomUUID()
      const timestamp = new Date().toISOString()
      
      // Upload all files
      const totalFiles = files.length
      let uploadedFiles = 0

      for (const { file, path } of files) {
        const key = `unity-builds/${gameSlug}/${path}`
        
        const result = await uploadData({
          path: key,
          data: file,
          options: {
            contentType: file.type || 'application/octet-stream',
            onProgress: ({ transferredBytes, totalBytes }) => {
              if (totalBytes) {
                const fileProgress = transferredBytes / totalBytes
                const overallProgress = ((uploadedFiles + fileProgress) / totalFiles) * 100
                setUploadProgress(Math.round(overallProgress))
              }
            }
          }
        }).result
        
        console.log(`Uploaded ${file.name} to ${result.path}`)

        uploadedFiles++
      }

      // Find the main Unity files
      const loaderFile = files.find(f => f.path.endsWith('.loader.js'))
      const dataFile = files.find(f => f.path.endsWith('.data'))
      const frameworkFile = files.find(f => f.path.endsWith('.framework.js'))
      const codeFile = files.find(f => f.path.endsWith('.wasm'))

      if (!loaderFile || !dataFile || !frameworkFile || !codeFile) {
        throw new Error('Missing required Unity WebGL files')
      }

      // Create game entity
      await client.models.Entity.create({
        pk: `GAME#${gameId}`,
        sk: 'METADATA',
        type: 'UNITY_PAGE',
        name: gameName,
        slug: gameSlug,
        enabled: true,
        s3Path: `unity-builds/${gameSlug}/`,
        config: JSON.stringify({
          loaderUrl: `unity-builds/${gameSlug}/${loaderFile.path}`,
          dataUrl: `unity-builds/${gameSlug}/${dataFile.path}`,
          frameworkUrl: `unity-builds/${gameSlug}/${frameworkFile.path}`,
          codeUrl: `unity-builds/${gameSlug}/${codeFile.path}`,
          streamingAssetsUrl: `unity-builds/${gameSlug}/StreamingAssets`,
          companyName: 'DefaultCompany',
          productName: gameName,
          productVersion: '1.0',
        }),
        createdAt: timestamp,
        updatedAt: timestamp,
        gsi2pk: 'UNITY_PAGE',
        gsi2sk: gameSlug,
      })

      onSuccess()
      handleClose()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload game')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setGameName('')
    setGameSlug('')
    setFiles([])
    setUploadProgress(0)
    setError('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Upload Unity WebGL Game
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              disabled={uploading}
            >
              <RiCloseLine className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Game Name
            </label>
            <input
              type="text"
              value={gameName}
              onChange={handleNameChange}
              placeholder="My Awesome Game"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL Slug
            </label>
            <input
              type="text"
              value={gameSlug}
              onChange={(e) => setGameSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-awesome-game"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={uploading}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Game will be accessible at: /unity/{gameSlug}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unity Build Files
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <RiUploadCloud2Line className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                multiple
                accept=".js,.wasm,.data,.json,.html,.css,.png,.jpg,.ico"
                className="hidden"
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                disabled={uploading}
              >
                Select Unity Build Files
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Select all files from your Unity WebGL build (Build folder + TemplateData)
              </p>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selected files: {files.length}
                </p>
                <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded p-2 text-xs">
                  {files.slice(0, 10).map((file, i) => (
                    <div key={i} className="text-gray-600 dark:text-gray-400">
                      {file.path}
                    </div>
                  ))}
                  {files.length > 10 && (
                    <div className="text-gray-500 dark:text-gray-500">
                      ... and {files.length - 10} more files
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {uploading && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-4">
          <button
            onClick={handleClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            disabled={uploading || !gameName || !gameSlug || files.length === 0}
          >
            {uploading ? 'Uploading...' : 'Upload Game'}
          </button>
        </div>
      </div>
    </div>
  )
}