console.log('Testing Unity WebGL upload to S3...');

// Simple test to verify we can upload to S3
async function testUpload() {
  try {
    // First, let's just test if we can access AWS Amplify
    const { Amplify } = await import('aws-amplify');
    const { uploadData } = await import('aws-amplify/storage');
    const config = await import('./amplify_outputs.json', { assert: { type: 'json' } });
    
    Amplify.configure(config.default);
    
    console.log('✅ Amplify configured successfully');
    
    // Test with a simple text file first
    const testKey = 'unity-builds/test/test.txt';
    const testData = Buffer.from('Hello from Unity WebGL test!');
    
    console.log('Uploading test file...');
    const result = await uploadData({
      key: testKey,
      data: testData,
    }).result;
    
    console.log('✅ Test upload successful!');
    console.log('Uploaded to:', result.key);
    
    // Now let's create the game in the database
    const { generateClient } = await import('aws-amplify/data');
    const client = generateClient();
    
    const gameId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    console.log('Creating game record...');
    await client.models.Entity.create({
      pk: `GAME#${gameId}`,
      sk: 'METADATA',
      type: 'UNITY_PAGE',
      name: 'vMouse Game',
      slug: 'vmouse',
      enabled: true,
      s3Path: 'unity-builds/vmouse/',
      config: JSON.stringify({
        loaderUrl: 'unity-builds/vmouse/Build/vMOUSE_builds.loader.js',
        dataUrl: 'unity-builds/vmouse/Build/vMOUSE_builds.data',
        frameworkUrl: 'unity-builds/vmouse/Build/vMOUSE_builds.framework.js',
        codeUrl: 'unity-builds/vmouse/Build/vMOUSE_builds.wasm',
        streamingAssetsUrl: 'unity-builds/vmouse/StreamingAssets',
        companyName: 'DefaultCompany',
        productName: 'vMouse Game',
        productVersion: '1.0',
      }),
      createdAt: timestamp,
      updatedAt: timestamp,
      gsi2pk: 'UNITY_PAGE',
      gsi2sk: 'vmouse',
    });
    
    console.log('✅ Game record created!');
    console.log('🎮 Visit http://localhost:3002/unity/vmouse to play');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testUpload();