# AWS Cognito Setup for Admin Panel

This guide walks through setting up AWS Cognito for the admin panel authentication.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured with profile `ct3defcon`

## Step 1: Create Cognito User Pool

```bash
# Create the user pool
aws cognito-idp create-user-pool \
  --pool-name "vMOUSE-Admin-Pool" \
  --auto-verified-attributes email \
  --username-attributes email \
  --password-policy "MinimumLength=12,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true" \
  --mfa-configuration "OPTIONAL" \
  --user-attribute-update-settings "AttributesRequireVerificationBeforeUpdate=email" \
  --profile ct3defcon \
  --region us-east-1
```

Save the `UserPool.Id` from the response.

## Step 2: Create User Pool Client

```bash
# Replace YOUR_USER_POOL_ID with the ID from step 1
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name "vMOUSE-Admin-Client" \
  --explicit-auth-flows "ALLOW_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" \
  --generate-secret \
  --profile ct3defcon \
  --region us-east-1
```

Save the `ClientId` and `ClientSecret` from the response.

## Step 3: Create Admin Group

```bash
aws cognito-idp create-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --group-name "admins" \
  --description "Admin users with file management permissions" \
  --profile ct3defcon \
  --region us-east-1
```

## Step 4: Create Admin User (CLI Only)

```bash
# Create user
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username "admin@example.com" \
  --user-attributes Name=email,Value=admin@example.com \
  --temporary-password "TempPassword123!" \
  --message-action "SUPPRESS" \
  --profile ct3defcon \
  --region us-east-1

# Add user to admins group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id YOUR_USER_POOL_ID \
  --username "admin@example.com" \
  --group-name "admins" \
  --profile ct3defcon \
  --region us-east-1

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username "admin@example.com" \
  --password "YourSecurePassword123!" \
  --permanent \
  --profile ct3defcon \
  --region us-east-1
```

## Step 5: Configure Environment Variables

Update your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_URL=https://d1t02l7s9hwtil.amplifyapp.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# AWS Cognito Configuration
COGNITO_CLIENT_ID=<your-client-id>
COGNITO_CLIENT_SECRET=<your-client-secret>
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/<your-user-pool-id>

# AWS Configuration (for S3 access)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
```

## Step 6: IAM Permissions for S3 Access

Create an IAM policy for the Lambda execution role or EC2 instance:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::ct3-unity-webgl-assets"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectTagging",
        "s3:PutObjectTagging"
      ],
      "Resource": "arn:aws:s3:::ct3-unity-webgl-assets/*"
    }
  ]
}
```

## Security Best Practices

1. **MFA**: Enable MFA for all admin users
   ```bash
   aws cognito-idp admin-set-user-mfa-preference \
     --user-pool-id YOUR_USER_POOL_ID \
     --username "admin@example.com" \
     --software-token-mfa-settings Enabled=true,PreferredMfa=true \
     --profile ct3defcon \
     --region us-east-1
   ```

2. **IP Restrictions**: Consider adding WAF rules to restrict admin access by IP

3. **Audit Logging**: Enable CloudTrail for all S3 operations

4. **Backup**: Enable point-in-time recovery for the S3 bucket

## Usage

1. Navigate to `/admin` on your deployed site
2. Sign in with your Cognito credentials
3. Select either vMOUSE Drone or vMOUSE Rover
4. Upload new Unity build files
5. Files will automatically have correct Content-Type and Content-Encoding headers

## Troubleshooting

- **Login fails**: Check user is in 'admins' group
- **S3 operations fail**: Verify IAM permissions and AWS credentials
- **File upload fails**: Check file size (max 200MB) and type (.data, .gz, .js, .wasm, .json)

## Important Notes

- No public registration is available
- Users can only be created via AWS CLI or Console
- All file operations are logged with user metadata
- Original files are replaced (consider implementing versioning)