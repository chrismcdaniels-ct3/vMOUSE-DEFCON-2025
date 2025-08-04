import { NextRequest, NextResponse } from 'next/server'
import { getUrl } from 'aws-amplify/storage'
import '@/lib/amplify'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await the params in Next.js 15
    const { path } = await params
    
    // Reconstruct the S3 key from the path segments
    const s3Key = path.join('/')
    
    console.log('Proxying Unity file:', s3Key)
    
    // Get a signed URL from S3
    // Amplify Storage might prepend 'public/' to the key
    let url;
    try {
      const result = await getUrl({ 
        key: s3Key,
        options: {
          expiresIn: 3600 // 1 hour
        }
      })
      url = result.url
    } catch (e) {
      // Try with public/ prefix
      const result = await getUrl({ 
        key: `public/${s3Key}`,
        options: {
          expiresIn: 3600 // 1 hour
        }
      })
      url = result.url
    }
    
    // Fetch the file from S3
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      console.error('S3 fetch failed:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'File not found', status: response.status },
        { status: 404 }
      )
    }
    
    // Get the content
    const content = await response.arrayBuffer()
    
    // Determine content type based on file extension
    const extension = s3Key.split('.').pop()?.toLowerCase()
    const contentTypes: Record<string, string> = {
      'js': 'application/javascript',
      'wasm': 'application/wasm',
      'data': 'application/octet-stream',
      'json': 'application/json',
      'png': 'image/png',
      'css': 'text/css',
      'html': 'text/html'
    }
    
    const contentType = contentTypes[extension || ''] || 'application/octet-stream'
    
    // Return the file with proper headers
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*', // Allow all origins
      }
    })
    
  } catch (error) {
    console.error('Error proxying Unity file:', error)
    return NextResponse.json(
      { error: 'Failed to load file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}