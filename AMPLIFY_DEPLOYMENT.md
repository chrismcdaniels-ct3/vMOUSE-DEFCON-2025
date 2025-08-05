# AWS Amplify Deployment Guide

This guide explains how to deploy the Unity WebGL Platform to AWS Amplify.

## Prerequisites

1. AWS Account with Amplify access
2. GitHub repository connected (already done: chrismcdaniels-ct3/vMOUSE-DEFCON-2025)
3. S3 bucket with Unity files (already set up: ct3-unity-webgl-assets)

## Amplify Setup Steps

### 1. Create New Amplify App

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Choose "GitHub" as the source provider
4. Authorize GitHub and select the repository: `chrismcdaniels-ct3/vMOUSE-DEFCON-2025`
5. Select branch: `main`

### 2. Configure Build Settings

Amplify will auto-detect the Next.js app and use the `amplify.yml` file in the repository.

### 3. Environment Variables

Add these environment variables in Amplify Console:

```bash
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_UNITY_USE_S3=true
NEXT_PUBLIC_UNITY_S3_BUCKET=ct3-unity-webgl-assets
NEXT_PUBLIC_UNITY_S3_REGION=us-east-1
NEXT_PUBLIC_UNITY_BASE_URL=https://ct3-unity-webgl-assets.s3.amazonaws.com
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

### 4. Deploy

1. Review settings and click "Save and deploy"
2. Amplify will build and deploy the application
3. Access your app at the provided Amplify URL

## Build Configuration

The `amplify.yml` file is configured to:
- Use pnpm for package management
- Build Next.js in standalone mode
- Copy necessary static files
- Set up proper caching

## Important Notes

- Unity files are served from S3, not from the repository
- The app uses Next.js 15 with standalone output
- CORS is configured on the S3 bucket for Unity file access

## Troubleshooting

### Build Failures
- Check Amplify build logs
- Ensure all environment variables are set
- Verify Node.js version compatibility (requires 18+)

### Unity Loading Issues
- Verify S3 bucket is accessible
- Check browser console for CORS errors
- Ensure S3 bucket policy allows public reads

### Performance
- Consider setting up CloudFront for S3 files
- Enable Amplify's performance mode
- Use the built-in caching strategies