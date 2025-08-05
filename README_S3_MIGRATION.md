# S3 Migration for Unity WebGL Files

This branch implements S3 support for hosting Unity WebGL builds, allowing you to serve Unity files from S3/CloudFront instead of your local server.

## What's Changed

1. **UnityPlayerLocal Component** (`components/unity/UnityPlayerLocal.tsx`)
   - Added `useS3` and `s3BaseUrl` props
   - Automatically constructs S3 URLs when `useS3` is true
   - Falls back to local paths when S3 is disabled

2. **Unity Game Page** (`app/(public)/unity/[id]/page.tsx`)
   - Reads S3 configuration from environment variables
   - Conditionally uses S3 or local URLs based on `NEXT_PUBLIC_UNITY_USE_S3`
   - Supports both CloudFront CDN and direct S3 URLs

3. **Environment Variables** (`.env.example`)
   - `NEXT_PUBLIC_UNITY_USE_S3`: Toggle S3 usage (true/false)
   - `NEXT_PUBLIC_UNITY_CDN_URL`: CloudFront distribution URL (preferred)
   - `NEXT_PUBLIC_UNITY_BASE_URL`: Direct S3 bucket URL (fallback)

4. **Upload Script** (`scripts/upload-unity-to-s3.mjs`)
   - Uploads Unity builds to S3 with correct content types
   - Handles gzipped files with proper content encoding
   - Sets cache headers for optimal performance

5. **CORS Configuration** (`next.config.ts`)
   - Added Cross-Origin-Resource-Policy header for S3 compatibility

## How to Use

### 1. Set up S3 Bucket

Follow the instructions in `S3_SETUP.md` to:
- Create an S3 bucket
- Configure CORS policy
- Set up CloudFront (recommended for COEP/COOP headers)

### 2. Upload Unity Files

```bash
# Install AWS SDK if not already installed
npm install @aws-sdk/client-s3 mime-types

# Set AWS credentials (if not already configured)
export AWS_PROFILE=your-profile
# OR
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret

# Upload Unity files
S3_BUCKET=your-unity-bucket S3_REGION=us-east-1 node scripts/upload-unity-to-s3.mjs
```

### 3. Configure Environment

Update your `.env.local`:

```bash
# Enable S3
NEXT_PUBLIC_UNITY_USE_S3=true

# Use CloudFront CDN (recommended)
NEXT_PUBLIC_UNITY_CDN_URL=https://your-distribution.cloudfront.net

# OR use direct S3 URL
NEXT_PUBLIC_UNITY_BASE_URL=https://your-bucket.s3.amazonaws.com
```

### 4. Test

Start your development server and verify Unity games load from S3:

```bash
npm run dev
```

Check the browser console - you should see Unity files loading from your S3/CloudFront URLs.

## Benefits

- **Better Performance**: CloudFront CDN provides global edge caching
- **Reduced Server Load**: Unity files served directly from S3
- **Cost Effective**: S3 bandwidth is typically cheaper than server bandwidth
- **Scalability**: No server bottlenecks for Unity file delivery

## Rollback

To disable S3 and use local files again:

```bash
NEXT_PUBLIC_UNITY_USE_S3=false
```

The application will automatically fall back to serving Unity files locally.