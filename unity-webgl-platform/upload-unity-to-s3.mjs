import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { readFile } from 'fs/promises';

// Read amplify_outputs.json to get bucket name
const amplifyOutputs = JSON.parse(readFileSync('amplify_outputs.json', 'utf8'));
const bucketName = amplifyOutputs.storage.bucket_name;
const region = amplifyOutputs.storage.aws_region;

console.log('S3 Bucket:', bucketName);
console.log('Region:', region);

// Create S3 client
const s3Client = new S3Client({
  region,
  credentials: fromIni({ profile: process.env.AWS_PROFILE || 'ct3defcon' })
});

// Create DynamoDB client
const dynamoClient = new DynamoDBClient({
  region,
  credentials: fromIni({ profile: process.env.AWS_PROFILE || 'ct3defcon' })
});

// Function to get all files in a directory recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);

  files.forEach(file => {
    const filePath = join(dirPath, file);
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Function to get content type based on file extension
function getContentType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const contentTypes = {
    'js': 'application/javascript',
    'wasm': 'application/wasm',
    'data': 'application/octet-stream',
    'json': 'application/json',
    'html': 'text/html',
    'css': 'text/css',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'ico': 'image/x-icon'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

async function uploadUnityBuildToS3() {
  const localBuildPath = './vmouse_builds';
  const s3Prefix = 'unity-builds/vmouse';
  
  console.log('\n📦 Uploading Unity build to S3...');
  console.log(`Local path: ${localBuildPath}`);
  console.log(`S3 prefix: ${s3Prefix}`);

  try {
    // Get all files in the build directory
    const files = getAllFiles(localBuildPath);
    console.log(`\nFound ${files.length} files to upload`);

    // Upload each file
    for (const filePath of files) {
      const relativePath = relative(localBuildPath, filePath);
      const s3Key = `${s3Prefix}/${relativePath}`.replace(/\\/g, '/'); // Ensure forward slashes
      
      console.log(`\nUploading: ${relativePath} -> ${s3Key}`);
      
      const fileContent = await readFile(filePath);
      const contentType = getContentType(filePath);
      
      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: fileContent,
        ContentType: contentType
      });

      await s3Client.send(putCommand);
      console.log(`✅ Uploaded: ${s3Key}`);
    }

    console.log('\n✅ All files uploaded successfully!');

    // Create the Unity config object
    const unityConfig = {
      dataUrl: `${s3Prefix}/Build/vMOUSE_builds.data`,
      frameworkUrl: `${s3Prefix}/Build/vMOUSE_builds.framework.js`,
      codeUrl: `${s3Prefix}/Build/vMOUSE_builds.wasm`,
      loaderUrl: `${s3Prefix}/Build/vMOUSE_builds.loader.js`,
      streamingAssetsUrl: `${s3Prefix}/StreamingAssets`,
      companyName: 'CTCubed',
      productName: 'vMOUSE',
      productVersion: '1.0'
    };

    console.log('\n📝 Unity Config for database:');
    console.log(JSON.stringify(unityConfig, null, 2));

    // Update the database entry
    console.log('\n🔄 Updating database entry...');
    
    const updateCommand = new UpdateItemCommand({
      TableName: 'Entity-3czauw33qbhrlgntcg5fu6yvdi-NONE',
      Key: {
        pk: { S: 'UNITY_PAGE#vmouse' },
        sk: { S: 'UNITY_PAGE#vmouse' }
      },
      UpdateExpression: 'SET config = :config, s3Path = :s3Path',
      ExpressionAttributeValues: {
        ':config': { S: JSON.stringify(unityConfig) },
        ':s3Path': { S: s3Prefix }
      }
    });

    await dynamoClient.send(updateCommand);
    console.log('✅ Database updated with S3 config');

    return unityConfig;

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the upload
uploadUnityBuildToS3()
  .then(() => {
    console.log('\n🎉 Upload complete! The game should now be accessible from S3.');
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });