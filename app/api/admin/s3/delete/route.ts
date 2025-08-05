import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_UNITY_S3_REGION || 'us-east-1'
})

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.groups?.includes('admins')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { key } = body

    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    }

    // Prevent deletion of critical files
    if (!key.startsWith('defcon_drone/') && !key.startsWith('defcon_rover/')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_UNITY_S3_BUCKET || 'ct3-unity-webgl-assets',
      Key: key
    })

    await s3Client.send(deleteCommand)

    return NextResponse.json({ 
      message: 'File deleted successfully',
      key 
    })
  } catch (error) {
    console.error('Delete S3 error:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}