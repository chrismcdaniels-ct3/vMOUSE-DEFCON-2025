import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_UNITY_S3_REGION || 'us-east-1'
})

const ALLOWED_FILE_EXTENSIONS = ['.data', '.gz', '.js', '.wasm', '.json']
const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.groups?.includes('admins')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const game = formData.get('game') as string

    if (!file || !game) {
      return NextResponse.json({ error: 'Missing file or game' }, { status: 400 })
    }

    // Validate file extension
    const fileExt = file.name.substring(file.name.lastIndexOf('.'))
    if (!ALLOWED_FILE_EXTENSIONS.some(ext => file.name.endsWith(ext))) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Determine content type and encoding
    let contentType = 'application/octet-stream'
    let contentEncoding = undefined

    if (file.name.endsWith('.gz')) {
      contentEncoding = 'gzip'
      const baseExt = file.name.replace('.gz', '').substring(file.name.replace('.gz', '').lastIndexOf('.'))
      
      if (baseExt === '.js') contentType = 'application/javascript'
      else if (baseExt === '.wasm') contentType = 'application/wasm'
      else if (baseExt === '.data') contentType = 'application/octet-stream'
    } else {
      if (fileExt === '.js') contentType = 'application/javascript'
      else if (fileExt === '.wasm') contentType = 'application/wasm'
      else if (fileExt === '.json') contentType = 'application/json'
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine S3 key
    const gamePrefix = game === 'drone' ? 'defcon_drone' : 'defcon_rover'
    const s3Key = `${gamePrefix}/Build/${file.name}`

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_UNITY_S3_BUCKET || 'ct3-unity-webgl-assets',
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      ContentEncoding: contentEncoding,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        uploadedBy: session.user.name || 'admin',
        uploadedAt: new Date().toISOString()
      }
    })

    await s3Client.send(putCommand)

    return NextResponse.json({ 
      message: 'File uploaded successfully',
      key: s3Key 
    })
  } catch (error) {
    console.error('Upload S3 error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}