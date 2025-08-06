import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { normalize, isAbsolute } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const filePath = pathSegments.join('/')
    
    // Sanitize and validate the path
    const normalizedPath = normalize(filePath)
    
    // Check for path traversal attempts
    if (normalizedPath.includes('..') || isAbsolute(normalizedPath)) {
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
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Read the file
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
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch {
    // Don't expose internal error details
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  }
}