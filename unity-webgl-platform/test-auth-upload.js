// Test authentication and upload flow

async function testAuthAndUpload() {
  try {
    console.log('=== Testing Auth and Upload Flow ===\n');
    
    const { Amplify } = await import('aws-amplify');
    const { signIn, signOut, fetchAuthSession } = await import('aws-amplify/auth');
    const { uploadData } = await import('aws-amplify/storage');
    const amplifyConfig = await import('./amplify_outputs.json', { assert: { type: 'json' } });
    
    Amplify.configure(amplifyConfig.default);
    
    // First sign out to ensure clean state
    console.log('1. Signing out any existing session...');
    try {
      await signOut();
    } catch (e) {
      // Ignore if not signed in
    }
    
    // Check initial auth state
    console.log('2. Initial auth state:');
    let session = await fetchAuthSession();
    console.log('   Has tokens:', !!session.tokens);
    console.log('   Identity ID:', session.identityId);
    
    // Sign in
    console.log('\n3. Signing in as admin...');
    try {
      const signInResult = await signIn({
        username: 'chris.mcdaniels@ctcubed.com',
        password: 'Superman!2Superman!2'
      });
      console.log('   Sign in successful:', signInResult.isSignedIn);
    } catch (err) {
      console.error('   Sign in error:', err.message);
      if (err.message.includes('crypto')) {
        console.log('   Note: Crypto error in Node.js environment');
      }
    }
    
    // Check auth state after sign in
    console.log('\n4. Auth state after sign in:');
    session = await fetchAuthSession();
    console.log('   Has tokens:', !!session.tokens);
    console.log('   Has credentials:', !!session.credentials);
    console.log('   Identity ID:', session.identityId);
    console.log('   User Sub:', session.userSub);
    
    if (session.tokens?.accessToken) {
      const payload = JSON.parse(
        Buffer.from(session.tokens.accessToken.toString().split('.')[1], 'base64').toString()
      );
      console.log('   Groups:', payload['cognito:groups'] || 'No groups');
    }
    
    // Test upload
    console.log('\n5. Testing S3 upload...');
    try {
      const testData = Buffer.from('Test Unity WebGL upload');
      const testPath = 'unity-builds/test-auth/test.txt';
      
      const uploadResult = await uploadData({
        path: testPath,
        data: testData,
        options: {
          contentType: 'text/plain'
        }
      }).result;
      
      console.log('   ✅ Upload successful!');
      console.log('   Uploaded to:', uploadResult.path);
      console.log('   ETag:', uploadResult.eTag);
    } catch (uploadErr) {
      console.error('   ❌ Upload failed:', uploadErr.message);
      if (uploadErr.message.includes('AccessDenied')) {
        console.log('\n   Debugging info:');
        console.log('   - Make sure you are signed in as admin');
        console.log('   - Check if user is in ADMINS group');
        console.log('   - Verify storage permissions in amplify/storage/resource.ts');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Add crypto polyfill for Node.js
global.crypto = require('crypto');

// Run the test
testAuthAndUpload();