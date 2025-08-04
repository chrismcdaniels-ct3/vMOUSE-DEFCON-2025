// Script to upload vMouse Unity game files to S3 and create database entry

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function uploadVMouseGame() {
  try {
    console.log('=== Uploading vMouse Unity Game ===\n');
    
    // Import and configure Amplify
    const { Amplify } = await import('aws-amplify');
    const { signIn, fetchAuthSession } = await import('aws-amplify/auth');
    const { uploadData } = await import('aws-amplify/storage');
    const { generateClient } = await import('aws-amplify/data');
    const amplifyConfig = await import('./amplify_outputs.json', { assert: { type: 'json' } });
    
    Amplify.configure(amplifyConfig.default);
    const client = generateClient();
    
    // Sign in as admin
    console.log('1. Signing in as admin...');
    try {
      await signIn({
        username: 'chris.mcdaniels@ctcubed.com',
        password: 'Superman!2Superman!2'
      });
      console.log('   ✓ Signed in successfully');
    } catch (err) {
      console.log('   Sign in error:', err.message);
    }
    
    // Verify auth
    const session = await fetchAuthSession();
    if (!session.tokens) {
      throw new Error('Not authenticated properly');
    }
    console.log('   ✓ Authentication verified');
    
    // Define game details
    const gameSlug = 'vmouse';
    const gameName = 'vMouse Game';
    const gameId = crypto.randomUUID();
    const buildPath = path.join(__dirname, 'vmouse_builds');
    
    // Define files to upload
    const filesToUpload = [
      { local: 'Build/vMOUSE_builds.data', s3: 'Build/vMOUSE_builds.data' },
      { local: 'Build/vMOUSE_builds.framework.js', s3: 'Build/vMOUSE_builds.framework.js' },
      { local: 'Build/vMOUSE_builds.loader.js', s3: 'Build/vMOUSE_builds.loader.js' },
      { local: 'Build/vMOUSE_builds.wasm', s3: 'Build/vMOUSE_builds.wasm' },
    ];
    
    console.log('\n2. Uploading Unity build files to S3...');
    
    for (const file of filesToUpload) {
      const filePath = path.join(buildPath, file.local);
      const fileData = fs.readFileSync(filePath);
      const s3Path = `unity-builds/${gameSlug}/${file.s3}`;
      
      console.log(`   Uploading ${file.local} (${(fileData.length / 1024 / 1024).toFixed(2)} MB)...`);
      
      // Convert Buffer to Blob for Amplify
      const blob = new Blob([fileData], {
        type: file.local.endsWith('.js') ? 'application/javascript' : 
              file.local.endsWith('.wasm') ? 'application/wasm' : 
              'application/octet-stream'
      });
      
      const uploadResult = await uploadData({
        path: s3Path,
        data: blob,
        options: {
          contentType: blob.type
        }
      }).result;
      
      console.log(`   ✓ Uploaded to ${uploadResult.path}`);
    }
    
    console.log('\n3. Creating game record in database...');
    
    const timestamp = new Date().toISOString();
    const gameRecord = await client.models.Entity.create({
      pk: `GAME#${gameId}`,
      sk: 'METADATA',
      type: 'UNITY_PAGE',
      name: gameName,
      slug: gameSlug,
      enabled: true,
      s3Path: `unity-builds/${gameSlug}/`,
      config: JSON.stringify({
        loaderUrl: `unity-builds/${gameSlug}/Build/vMOUSE_builds.loader.js`,
        dataUrl: `unity-builds/${gameSlug}/Build/vMOUSE_builds.data`,
        frameworkUrl: `unity-builds/${gameSlug}/Build/vMOUSE_builds.framework.js`,
        codeUrl: `unity-builds/${gameSlug}/Build/vMOUSE_builds.wasm`,
        streamingAssetsUrl: `unity-builds/${gameSlug}/StreamingAssets`,
        companyName: 'DefaultCompany',
        productName: gameName,
        productVersion: '1.0',
      }),
      createdAt: timestamp,
      updatedAt: timestamp,
      gsi2pk: 'UNITY_PAGE',
      gsi2sk: gameSlug,
    });
    
    if (gameRecord.data) {
      console.log('   ✓ Game record created successfully');
      console.log('   Game ID:', gameId);
    }
    
    console.log('\n✅ SUCCESS! vMouse game uploaded!');
    console.log('🎮 Play the game at: http://localhost:3002/unity/vmouse');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Add crypto polyfill
global.crypto = crypto;

// Run the upload
uploadVMouseGame();