# Manual Test Instructions for Unity WebGL Upload

## Prerequisites
1. Development server running on http://localhost:3002
2. Amplify sandbox configured (amplify_outputs.json exists)
3. vmouse_builds folder with Unity WebGL files

## Test Steps

### 1. Login to Admin Dashboard
1. Open browser and navigate to: http://localhost:3002/dashboard
2. Login with credentials:
   - Email: [REDACTED - Use environment variables]
   - Password: [REDACTED - Use environment variables]

### 2. Upload Unity Game
1. Click the "Add Game" button in the dashboard
2. Fill in the following details:
   - Game Name: vMouse Game
   - URL Slug: vmouse
3. Click "Select Unity Build Files" button
4. Navigate to the vmouse_builds folder and select ALL files from:
   - Build folder (4 files: .data, .framework.js, .loader.js, .wasm)
   - TemplateData folder (all image and CSS files)
   - index.html file
5. Click "Upload Game" and wait for progress to complete

### 3. Verify Game Appears in Dashboard
1. After upload completes, the modal should close
2. You should see "vMouse Game" listed in the games table
3. Note the "View" link next to the game

### 4. Test the Game
1. Click the "View" link or navigate to: http://localhost:3002/unity/vmouse
2. Wait for the Unity player to load (you should see a loading progress bar)
3. Once loaded, the Unity game should be playable

## Expected Results
- ✅ Game uploads successfully to S3
- ✅ Game appears in dashboard with "Active" status
- ✅ Game page loads at /unity/vmouse
- ✅ Unity WebGL content loads and is playable

## Troubleshooting

### If upload fails:
1. Check browser console for errors
2. Verify all Unity build files are selected
3. Check Docker logs: `docker logs unity-webgl-platform`

### If game doesn't load:
1. Check browser console for Unity loading errors
2. Verify S3 URLs are being generated correctly
3. Check network tab for failed resource loads

## Alternative: Command Line Upload Test

If the UI upload doesn't work, you can test the S3 upload directly:

```bash
# Inside Docker container
docker exec -it unity-webgl-platform sh

# Test S3 upload manually
node -e "
const { uploadData } = require('aws-amplify/storage');
const fs = require('fs');

async function testUpload() {
  const file = fs.readFileSync('/app/../vmouse_builds/Build/vMOUSE_builds.loader.js');
  const result = await uploadData({
    key: 'unity-builds/test/Build/loader.js',
    data: file
  }).result;
  console.log('Upload successful:', result);
}

testUpload().catch(console.error);
"
```