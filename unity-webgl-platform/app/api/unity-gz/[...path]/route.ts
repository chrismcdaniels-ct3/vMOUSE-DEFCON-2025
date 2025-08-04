import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const filePath = pathSegments.join('/')
    
    // Construct the full file path
    const fullPath = path.join(process.cwd(), 'public', 'unity-builds', 'defcon_drone_gz', filePath)
    
    // Read the file
    const fileBuffer = await readFile(fullPath)
    
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
  } catch (error) {
    console.error('Error serving Unity file:', error)
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    )
  }
}