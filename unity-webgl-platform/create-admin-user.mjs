#!/usr/bin/env node

import { AdminCreateUserCommand, AdminAddUserToGroupCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read amplify_outputs.json to get the user pool ID
const amplifyOutputs = JSON.parse(readFileSync(join(__dirname, 'amplify_outputs.json'), 'utf8'));
const userPoolId = amplifyOutputs.auth.user_pool_id;
const region = amplifyOutputs.auth.aws_region;

// Get email from command line
const email = process.argv[2];
const temporaryPassword = process.argv[3] || 'TempPass123!';

if (!email) {
  console.error('Usage: node create-admin-user.js <email> [temporary-password]');
  console.error('Example: node create-admin-user.js admin@example.com MyTempPass123!');
  process.exit(1);
}

// Create Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region,
  credentials: fromIni({ profile: process.env.AWS_PROFILE || 'ct3defcon' })
});

async function createAdminUser() {
  try {
    // Create the user
    console.log(`Creating user ${email} in user pool ${userPoolId}...`);
    
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'email_verified',
          Value: 'true'
        }
      ],
      TemporaryPassword: temporaryPassword,
      MessageAction: 'SUPPRESS' // Don't send welcome email
    });

    await cognitoClient.send(createUserCommand);
    console.log('✅ User created successfully');

    // Add user to ADMINS group
    console.log('Adding user to ADMINS group...');
    
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: email,
      GroupName: 'ADMINS'
    });

    await cognitoClient.send(addToGroupCommand);
    console.log('✅ User added to ADMINS group');

    console.log('\n🎉 Admin user created successfully!');
    console.log(`\nLogin credentials:`);
    console.log(`Email: ${email}`);
    console.log(`Temporary Password: ${temporaryPassword}`);
    console.log('\nYou will be prompted to change your password on first login.');
    console.log(`\nLogin at: http://localhost:3000/auth/login`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.message.includes('User already exists')) {
      console.log('\nTo add an existing user to the ADMINS group, you can use the AWS CLI:');
      console.log(`aws cognito-idp admin-add-user-to-group --user-pool-id ${userPoolId} --username ${email} --group-name ADMINS --profile ct3defcon`);
    }
  }
}

createAdminUser();