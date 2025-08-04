import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import './lib/amplify.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = generateClient();

async function uploadGame() {
  console.log('Starting Unity WebGL game upload...');
  
  const gameSlug = 'vmouse';
  const gameName = 'vMouse Game';
  const buildPath = path.join(__dirname, '..', 'vmouse_builds');
  
  try {
    // Read all Unity build files
    const files = [
      { local: 'Build/vMOUSE_builds.data', s3: 'Build/vMOUSE_builds.data' },
      { local: 'Build/vMOUSE_builds.framework.js', s3: 'Build/vMOUSE_builds.framework.js' },
      { local: 'Build/vMOUSE_builds.loader.js', s3: 'Build/vMOUSE_builds.loader.js' },
      { local: 'Build/vMOUSE_builds.wasm', s3: 'Build/vMOUSE_builds.wasm' },
    ];
    
    console.log('Uploading files to S3...');
    
    // Upload each file
    for (const file of files) {
      const filePath = path.join(buildPath, file.local);
      const fileData = fs.readFileSync(filePath);
      const key = `unity-builds/${gameSlug}/${file.s3}`;
      
      console.log(`Uploading ${file.local}...`);
      await uploadData({
        key,
        data: fileData,
      }).result;
      console.log(`✓ Uploaded ${file.local}`);
    }
    
    // Create game record in database
    console.log('Creating game record in database...');
    
    const gameId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    await client.models.Entity.create({
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
    
    console.log('✅ Game uploaded successfully!');
    console.log(`🎮 Play the game at: http://localhost:3002/unity/${gameSlug}`);
    
  } catch (error) {
    console.error('❌ Error uploading game:', error);
    process.exit(1);
  }
}

// Run the upload
uploadGame();