import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { readFileSync } from 'fs';

// Read amplify_outputs.json to get the table name
const amplifyOutputs = JSON.parse(readFileSync('amplify_outputs.json', 'utf8'));

// Find the DynamoDB table name from the model introspection
const tableName = Object.values(amplifyOutputs.data.model_introspection.models)[0].operations.list.request;

console.log('Table name:', tableName);

const client = new DynamoDBClient({
  region: 'us-east-2',
  credentials: fromIni({ profile: process.env.AWS_PROFILE || 'ct3defcon' })
});

async function listAllEntities() {
  try {
    const command = new ScanCommand({
      TableName: tableName.split('#')[0], // Extract table name from the request string
      FilterExpression: 'gsi2pk = :gsi2pk AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':gsi2pk': { S: 'UNITY_PAGE' },
        ':type': { S: 'UNITY_PAGE' }
      }
    });

    const response = await client.send(command);
    
    console.log('\n📊 Unity Pages in Database:');
    console.log('Count:', response.Count);
    
    if (response.Items && response.Items.length > 0) {
      response.Items.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.name?.S || 'Unnamed'}`);
        console.log(`   Slug: ${item.slug?.S}`);
        console.log(`   Enabled: ${item.enabled?.BOOL}`);
        console.log(`   S3 Path: ${item.s3Path?.S}`);
        console.log(`   Created: ${item.createdAt?.S}`);
        console.log(`   PK: ${item.pk?.S}`);
        console.log(`   SK: ${item.sk?.S}`);
      });
    } else {
      console.log('No Unity pages found in the database');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

listAllEntities();