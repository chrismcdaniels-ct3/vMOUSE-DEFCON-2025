import { S3Client, PutObjectAclCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { readFileSync } from 'fs';

// Read amplify_outputs.json to get bucket name
const amplifyOutputs = JSON.parse(readFileSync('amplify_outputs.json', 'utf8'));
const bucketName = amplifyOutputs.storage.bucket_name;
const region = amplifyOutputs.storage.aws_region;

const s3Client = new S3Client({
  region,
  credentials: fromIni({ profile: process.env.AWS_PROFILE || 'ct3defcon' })
});

async function makeUnityFilesPublic() {
  try {
    console.log('🔓 Making Unity files publicly accessible...');
    
    // List all files in the unity-builds/vmouse directory
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'unity-builds/vmouse/'
    });
    
    const response = await s3Client.send(listCommand);
    
    if (!response.Contents) {
      console.log('No files found');
      return;
    }
    
    console.log(`Found ${response.Contents.length} files to update`);
    
    // Update each file to have public-read ACL
    for (const file of response.Contents) {
      try {
        console.log(`Setting public access for: ${file.Key}`);
        
        const aclCommand = new PutObjectAclCommand({
          Bucket: bucketName,
          Key: file.Key,
          ACL: 'public-read'
        });
        
        await s3Client.send(aclCommand);
        console.log(`✅ ${file.Key}`);
      } catch (error) {
        console.error(`❌ Failed to update ${file.Key}:`, error.message);
      }
    }
    
    console.log('\n✅ Done! Unity files should now be publicly accessible.');
    console.log('\nPublic URLs will be in the format:');
    console.log(`https://${bucketName}.s3.${region}.amazonaws.com/unity-builds/vmouse/Build/vMOUSE_builds.loader.js`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

makeUnityFilesPublic();