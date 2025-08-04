import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // List of admin routes that require authentication
  const adminRoutes = ['/dashboard', '/settings', '/admin']
  
  // Check if the current route is an admin route
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  
  if (isAdminRoute) {
    // Check for authentication token in cookies
    const authToken = request.cookies.get('amplify-auth-token')
    
    if (!authToken) {
      // Redirect to login page if not authenticated
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth routes (login, register, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|auth|unity).*)',
  ],
}