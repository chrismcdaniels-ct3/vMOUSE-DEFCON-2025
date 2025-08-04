import { NextRequest, NextResponse } from 'next/server'
import { getUrl } from 'aws-amplify/storage'
import '@/lib/amplify'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const s3Key = path.join('/')
    
    // Try different key variations
    const keysToTry = [
      s3Key,
      `public/${s3Key}`,
      s3Key.replace('unity-builds/', 'public/unity-builds/'),
    ]
    
    const results = []
    
    for (const key of keysToTry) {
      try {
        const result = await getUrl({ 
          key,
          options: {
            expiresIn: 3600
          }
        })
        results.push({
          key,
          success: true,
          url: result.url.toString()
        })
      } catch (error) {
        results.push({
          key,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      requestedKey: s3Key,
      results
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}