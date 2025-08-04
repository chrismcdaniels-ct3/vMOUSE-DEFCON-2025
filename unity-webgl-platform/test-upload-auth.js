const crypto = require('crypto');
console.log('Testing Unity WebGL upload with authentication...');

async function testUploadWithAuth() {
  try {
    const { Amplify } = await import('aws-amplify');
    const { signIn } = await import('aws-amplify/auth');
    const { uploadData } = await import('aws-amplify/storage');
    const { generateClient } = await import('aws-amplify/data');
    const config = await import('./amplify_outputs.json', { assert: { type: 'json' } });
    
    Amplify.configure(config.default);
    
    console.log('✅ Amplify configured');
    
    // Sign in first
    console.log('Signing in as admin...');
    try {
      const signInResult = await signIn({
        username: 'chris.mcdaniels@ctcubed.com',
        password: 'Superman!2Superman!2',
      });
      console.log('✅ Signed in successfully');
    } catch (err) {
      console.log('Sign in error:', err.message);
    }
    
    // Create the game record in the database
    const client = generateClient();
    const gameId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    console.log('Creating game record in database...');
    const result = await client.models.Entity.create({
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
    console.log('Game ID:', gameId);
    
    // Now test S3 upload
    console.log('Testing S3 upload...');
    const testData = Buffer.from('Unity WebGL test file');
    const uploadResult = await uploadData({
      key: 'unity-builds/vmouse/test.txt',
      data: testData,
    }).result;
    
    console.log('✅ S3 upload successful!');
    console.log('Uploaded to:', uploadResult.key);
    
    console.log('\n🎮 Game setup complete!');
    console.log('📁 You can now manually upload the Unity build files to S3');
    console.log('🌐 Visit http://localhost:3002/unity/vmouse to play');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      error.errors.forEach(err => console.error(' -', err.message));
    }
  }
}

testUploadWithAuth();