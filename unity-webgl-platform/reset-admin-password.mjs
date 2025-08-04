import { CognitoIdentityProviderClient, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { fromIni } from '@aws-sdk/credential-provider-ini';
import { readFileSync } from 'fs';

// Read amplify_outputs.json to get the user pool ID
const amplifyOutputs = JSON.parse(readFileSync('amplify_outputs.json', 'utf8'));
const userPoolId = amplifyOutputs.auth.user_pool_id;
const region = amplifyOutputs.auth.aws_region;

const email = 'chris.mcdaniels@ctcubed.com';
const newPassword = 'Superman!2Superman!2';

console.log(`Resetting password for ${email} in user pool ${userPoolId}...`);

const cognitoClient = new CognitoIdentityProviderClient({
  region,
  credentials: fromIni({ profile: process.env.AWS_PROFILE || 'ct3defcon' })
});

async function resetPassword() {
  try {
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: newPassword,
      Permanent: true
    });

    await cognitoClient.send(command);
    console.log('✅ Password reset successfully!');
    console.log(`\nYou can now login with:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  }
}

resetPassword();