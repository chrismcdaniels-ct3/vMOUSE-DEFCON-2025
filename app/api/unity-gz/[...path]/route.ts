import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { normalize, isAbsolute } from 'path'

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 100 // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in milliseconds

// Security logging
function logSecurityEvent(type: string, ip: string, details: any) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] [${type}] IP: ${ip} - ${JSON.stringify(details)}`
  
  // In production, send to proper logging service
  if (process.env.NODE_ENV === 'production') {
    // For now, just use console.error for security events
    console.error(logEntry)
  }
}

function getRateLimitKey(request: NextRequest): string {
  // Get IP from headers (works with proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return ip
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key)
      }
    }
  }
  
  if (!record || record.resetTime < now) {
    // Start new window
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const startTime = Date.now()
  const ip = getRateLimitKey(request)
  
  // Check rate limit
  if (!checkRateLimit(ip)) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', ip, { path: request.url })
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }
  
  try {
    // Add request timeout (30 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 30000)
    )
    
    const processRequest = async () => {
      const { path: pathSegments } = await params
      const filePath = pathSegments.join('/')
      
      // Enhanced path validation
      const normalizedPath = normalize(filePath)
      
      // Check for path traversal attempts
      if (normalizedPath.includes('..') || 
          isAbsolute(normalizedPath) ||
          normalizedPath.includes('~') ||
          normalizedPath.includes('\\') ||
          /[<>:"|?*]/.test(normalizedPath)) {
        logSecurityEvent('PATH_TRAVERSAL_ATTEMPT', ip, { 
          attemptedPath: filePath,
          normalized: normalizedPath 
        })
        return NextResponse.json(
          { error: 'Invalid path' },
          { status: 400 }
        )
      }
    
    // Construct the full file path
    const fullPath = path.join(process.cwd(), 'public', 'unity-builds', 'defcon_drone_gz', normalizedPath)
    const resolvedPath = path.resolve(fullPath)
    const allowedDir = path.resolve(path.join(process.cwd(), 'public', 'unity-builds', 'defcon_drone_gz'))
    
      // Ensure the resolved path is within the allowed directory
      if (!resolvedPath.startsWith(allowedDir)) {
        logSecurityEvent('UNAUTHORIZED_ACCESS', ip, { 
          attemptedPath: resolvedPath,
          allowedDir: allowedDir
        })
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    
      // Read the file with size check
      const stats = await (await import('fs/promises')).stat(resolvedPath)
      
      // Limit file size to 100MB
      if (stats.size > 100 * 1024 * 1024) {
        logSecurityEvent('FILE_TOO_LARGE', ip, { 
          path: filePath,
          size: stats.size 
        })
        return NextResponse.json(
          { error: 'File too large' },
          { status: 413 }
        )
      }
      
      const fileBuffer = await readFile(resolvedPath)
    
    // Determine content type based on file extension
    let contentType = 'application/octet-stream'
    const ext = path.extname(filePath).toLowerCase()
    
    if (ext === '.js' || filePath.endsWith('.js.gz')) {
      contentType = 'application/javascript'
    } else if (ext === '.wasm' || filePath.endsWith('.wasm.gz')) {
      contentType = 'application/wasm'
    } else if (ext === '.data' || filePath.endsWith('.data.gz')) {
      contentType = 'application/octet-stream'
    }
    
    // Create response headers
    const headers: HeadersInit = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    }
    
    // Add gzip encoding header for .gz files
    if (filePath.endsWith('.gz')) {
      headers['Content-Encoding'] = 'gzip'
    }
    
      // Log successful request (sample for monitoring)
      if (Math.random() < 0.1) { // Log 10% of successful requests
        logSecurityEvent('FILE_SERVED', ip, { 
          path: filePath,
          size: fileBuffer.length,
          duration: Date.now() - startTime
        })
      }
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      })
    }
    
    // Race between request processing and timeout
    return await Promise.race([
      processRequest(),
      timeoutPromise
    ]) as NextResponse
  } catch (error) {
    // Log errors for monitoring
    if (error instanceof Error && error.message === 'Request timeout') {
      logSecurityEvent('REQUEST_TIMEOUT', ip, { path: request.url })
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      )
    }
    
    // Don't expose internal error details
    logSecurityEvent('FILE_ERROR', ip, { 
      path: request.url,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  }
}