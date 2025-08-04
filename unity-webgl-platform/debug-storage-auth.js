// Debug script to understand the storage authentication issue

async function debugStorageAuth() {
  try {
    console.log('=== Storage Auth Debug ===\n');
    
    // Import required modules
    const { Amplify } = await import('aws-amplify');
    const amplifyConfig = await import('./amplify_outputs.json', { assert: { type: 'json' } });
    
    // Configure Amplify
    Amplify.configure(amplifyConfig.default);
    
    // Check configuration
    const config = Amplify.getConfig();
    console.log('1. Storage Configuration:');
    console.log('   Bucket:', config.Storage?.S3?.bucket);
    console.log('   Region:', config.Storage?.S3?.region);
    console.log('   Has Storage:', !!config.Storage);
    
    // Check auth mode
    console.log('\n2. Auth Configuration:');
    console.log('   Auth Mode:', config.Auth?.Cognito?.identityPoolId ? 'Identity Pool' : 'User Pool Only');
    console.log('   Identity Pool ID:', config.Auth?.Cognito?.identityPoolId || 'Not configured');
    console.log('   User Pool ID:', config.Auth?.Cognito?.userPoolId);
    
    // Check storage access rules from config
    console.log('\n3. Storage Access Rules from Config:');
    const storageConfig = amplifyConfig.default.storage;
    console.log('   Bucket Name:', storageConfig?.bucket_name);
    console.log('   AWS Region:', storageConfig?.aws_region);
    
    // Try to get current auth session
    console.log('\n4. Checking Auth Session:');
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      
      console.log('   Has Tokens:', !!session.tokens);
      console.log('   Has Credentials:', !!session.credentials);
      console.log('   Identity ID:', session.identityId || 'Not available');
      console.log('   User Sub:', session.userSub || 'Not available');
      
      if (session.tokens?.accessToken) {
        // Decode the JWT to check groups
        const payload = JSON.parse(
          Buffer.from(session.tokens.accessToken.toString().split('.')[1], 'base64').toString()
        );
        console.log('   User Groups:', payload['cognito:groups'] || 'No groups');
      }
    } catch (err) {
      console.log('   Auth Error:', err.message);
    }
    
    // Check the actual storage path configuration
    console.log('\n5. Analyzing Storage Path:');
    console.log('   Attempting to upload to: unity-builds/*');
    console.log('   This requires authentication based on amplify/storage/resource.ts');
    
    console.log('\n=== Recommendations ===');
    console.log('1. Ensure user is authenticated before upload');
    console.log('2. Check if identity pool is properly configured');
    console.log('3. Verify user has ADMINS group membership');
    console.log('4. Use proper path format in uploadData()');
    
  } catch (error) {
    console.error('Debug Error:', error);
  }
}

// Run the debug
debugStorageAuth();