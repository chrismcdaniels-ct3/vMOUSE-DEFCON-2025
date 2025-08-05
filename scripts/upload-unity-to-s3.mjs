#!/usr/bin/env node

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFile, readdir, stat } from 'fs/promises'
import path from 'path'
import mime from 'mime-types'

// Configuration - Update these values
const S3_BUCKET = process.env.S3_BUCKET || 'your-unity-webgl-assets'
const S3_REGION = process.env.S3_REGION || 'us-east-1'
const LOCAL_UNITY_PATH = process.env.LOCAL_UNITY_PATH || './public/unity-builds'
const S3_PREFIX = process.env.S3_PREFIX || '' // Optional prefix for S3 paths

// Initialize S3 client
const s3Client = new S3Client({ region: S3_REGION })

// Helper function to get content type and encoding
function getContentTypeAndEncoding(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const isGzipped = filePath.endsWith('.gz')
  
  let contentType = 'application/octet-stream'
  let contentEncoding = undefined
  
  // Handle gzipped files
  if (isGzipped) {
    contentEncoding = 'gzip'
    const baseExt = path.extname(filePath.replace('.gz', '')).toLowerCase()
    
    if (baseExt === '.js') contentType = 'application/javascript'
    else if (baseExt === '.wasm') contentType = 'application/wasm'
    else if (baseExt === '.data') contentType = 'application/octet-stream'
  } else {
    // Non-gzipped files
    if (ext === '.js') contentType = 'application/javascript'
    else if (ext === '.wasm') contentType = 'application/wasm'
    else if (ext === '.data') contentType = 'application/octet-stream'
    else if (ext === '.json') contentType = 'application/json'
    else if (ext === '.html') contentType = 'text/html'
    else contentType = mime.lookup(filePath) || 'application/octet-stream'
  }
  
  return { contentType, contentEncoding }
}

// Recursive function to upload directory
async function uploadDirectory(localPath, s3Path = '') {
  const items = await readdir(localPath)
  
  for (const item of items) {
    const itemPath = path.join(localPath, item)
    const itemStat = await stat(itemPath)
    
    if (itemStat.isDirectory()) {
      // Recursively upload subdirectories
      await uploadDirectory(itemPath, path.join(s3Path, item))
    } else {
      // Upload file
      const s3Key = S3_PREFIX ? path.join(S3_PREFIX, s3Path, item) : path.join(s3Path, item)
      await uploadFile(itemPath, s3Key)
    }
  }
}

// Function to upload a single file
async function uploadFile(localPath, s3Key) {
  try {
    const fileContent = await readFile(localPath)
    const { contentType, contentEncoding } = getContentTypeAndEncoding(localPath)
    
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }
    
    // Add content encoding if file is gzipped
    if (contentEncoding) {
      params.ContentEncoding = contentEncoding
    }
    
    const command = new PutObjectCommand(params)
    await s3Client.send(command)
    
    console.log(`✅ Uploaded: ${localPath} → s3://${S3_BUCKET}/${s3Key}`)
    console.log(`   Content-Type: ${contentType}${contentEncoding ? `, Content-Encoding: ${contentEncoding}` : ''}`)
  } catch (error) {
    console.error(`❌ Failed to upload ${localPath}:`, error.message)
    throw error
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Unity WebGL upload to S3...')
  console.log(`📁 Source: ${LOCAL_UNITY_PATH}`)
  console.log(`☁️  Destination: s3://${S3_BUCKET}/${S3_PREFIX}`)
  console.log('')
  
  try {
    // Check if source directory exists
    const sourceStat = await stat(LOCAL_UNITY_PATH).catch(() => null)
    if (!sourceStat || !sourceStat.isDirectory()) {
      throw new Error(`Source directory not found: ${LOCAL_UNITY_PATH}`)
    }
    
    // Start upload
    await uploadDirectory(LOCAL_UNITY_PATH)
    
    console.log('\n✨ Upload completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Update your .env file:')
    console.log(`   NEXT_PUBLIC_UNITY_USE_S3=true`)
    console.log(`   NEXT_PUBLIC_UNITY_BASE_URL=https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`)
    console.log('2. Configure CORS on your S3 bucket (see S3_SETUP.md)')
    console.log('3. Test Unity games load correctly from S3')
    
  } catch (error) {
    console.error('\n❌ Upload failed:', error.message)
    process.exit(1)
  }
}

// Run the script
main()