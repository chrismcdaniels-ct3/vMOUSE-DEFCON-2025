import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_UNITY_S3_REGION || 'us-east-1'
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.groups?.includes('admins')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const prefix = searchParams.get('prefix') || ''

    const command = new ListObjectsV2Command({
      Bucket: process.env.NEXT_PUBLIC_UNITY_S3_BUCKET || 'ct3-unity-webgl-assets',
      Prefix: prefix
    })

    const response = await s3Client.send(command)
    
    const files = response.Contents?.map(item => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified
    })) || []

    return NextResponse.json({ files })
  } catch (error) {
    console.error('List S3 error:', error)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}