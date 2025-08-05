#!/bin/bash

# Fix S3 headers for Unity WebGL gzipped files
BUCKET="ct3-unity-webgl-assets"
PROFILE="ct3defcon"
REGION="us-east-1"

echo "Fixing S3 headers for Unity files..."

# Fix .data.gz files
aws s3 cp s3://$BUCKET/defcon_drone/Build/defcon_drone.data.gz s3://$BUCKET/defcon_drone/Build/defcon_drone.data.gz \
  --content-type "application/octet-stream" \
  --content-encoding "gzip" \
  --metadata-directive REPLACE \
  --profile $PROFILE \
  --region $REGION

# Fix .wasm.gz files  
aws s3 cp s3://$BUCKET/defcon_drone/Build/defcon_drone.wasm.gz s3://$BUCKET/defcon_drone/Build/defcon_drone.wasm.gz \
  --content-type "application/wasm" \
  --content-encoding "gzip" \
  --metadata-directive REPLACE \
  --profile $PROFILE \
  --region $REGION

# Fix .framework.js.gz files
aws s3 cp s3://$BUCKET/defcon_drone/Build/defcon_drone.framework.js.gz s3://$BUCKET/defcon_drone/Build/defcon_drone.framework.js.gz \
  --content-type "application/javascript" \
  --content-encoding "gzip" \
  --metadata-directive REPLACE \
  --profile $PROFILE \
  --region $REGION

# Do the same for rover files if they exist
if aws s3 ls s3://$BUCKET/defcon_rover/Build/ --profile $PROFILE --region $REGION > /dev/null 2>&1; then
  echo "Fixing rover files..."
  
  aws s3 cp s3://$BUCKET/defcon_rover/Build/defcon_rover.data.gz s3://$BUCKET/defcon_rover/Build/defcon_rover.data.gz \
    --content-type "application/octet-stream" \
    --content-encoding "gzip" \
    --metadata-directive REPLACE \
    --profile $PROFILE \
    --region $REGION

  aws s3 cp s3://$BUCKET/defcon_rover/Build/defcon_rover.wasm.gz s3://$BUCKET/defcon_rover/Build/defcon_rover.wasm.gz \
    --content-type "application/wasm" \
    --content-encoding "gzip" \
    --metadata-directive REPLACE \
    --profile $PROFILE \
    --region $REGION

  aws s3 cp s3://$BUCKET/defcon_rover/Build/defcon_rover.framework.js.gz s3://$BUCKET/defcon_rover/Build/defcon_rover.framework.js.gz \
    --content-type "application/javascript" \
    --content-encoding "gzip" \
    --metadata-directive REPLACE \
    --profile $PROFILE \
    --region $REGION
fi

echo "Headers fixed! Unity files should now load properly."