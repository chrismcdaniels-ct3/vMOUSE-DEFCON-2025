'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth'
import '@/lib/amplify'

interface AdminRouteProps {
  children: React.ReactNode
  fallbackUrl?: string
}

export default function AdminRoute({ children, fallbackUrl = '/auth/login' }: AdminRouteProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAuth()
  }, [])

  async function checkAdminAuth() {
    try {
      // First check if user is authenticated
      const user = await getCurrentUser()
      
      // Then check if user has admin privileges
      const session = await fetchAuthSession()
      const groups = session.tokens?.idToken?.payload['cognito:groups'] as string[] | undefined
      
      // Check if user is in admin group
      if (groups && groups.includes('admin')) {
        setIsAuthorized(true)
      } else {
        console.log('User is not an admin')
        router.push('/')
      }
    } catch (error) {
      console.error('Not authenticated:', error)
      router.push(fallbackUrl)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authorization...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You do not have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}