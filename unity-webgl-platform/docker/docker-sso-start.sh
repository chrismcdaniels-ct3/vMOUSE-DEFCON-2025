#!/bin/bash

echo "🔐 Setting up AWS SSO credentials for Docker..."

# Prompt for AWS profile
echo ""
read -p "Enter AWS SSO profile (default: ct3defcon): " PROFILE
PROFILE=${PROFILE:-ct3defcon}

# Prompt for sandbox identifier
echo ""
read -p "Enter sandbox identifier (default: jack1): " SANDBOX_ID
SANDBOX_ID=${SANDBOX_ID:-jack1}

# Prompt for AWS region
echo ""
read -p "Enter AWS region (default: us-east-2): " INPUT_REGION
INPUT_REGION=${INPUT_REGION:-us-east-2}

# Confirm settings
echo ""
echo "📋 Configuration Summary:"
echo "   AWS Profile: $PROFILE"
echo "   Sandbox Identifier: $SANDBOX_ID"
echo "   AWS Region: $INPUT_REGION"
echo ""
read -p "Is this correct? (Y/n): " CONFIRM
CONFIRM=${CONFIRM:-Y}

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
fi

# Ensure SSO login
echo "📝 Checking AWS SSO login status..."
aws sts get-caller-identity --profile $PROFILE > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "🔑 Need to login to AWS SSO..."
    aws sso login --profile $PROFILE
fi

# Export credentials
echo "📤 Exporting temporary credentials..."
export $(aws configure export-credentials --profile $PROFILE --format env-no-export)

# Verify credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ Failed to export AWS credentials. Please check your SSO session."
    exit 1
fi

echo "✅ AWS credentials exported successfully"

# Start Docker with credentials
echo "🚀 Starting Docker with AWS credentials..."

# Check if containers are already running
if docker ps | grep -q unity-webgl-platform; then
    echo "🔄 Restarting existing containers with new credentials..."
    docker-compose down
fi

# Get the region from the profile (but use INPUT_REGION if provided)
AWS_REGION=${INPUT_REGION:-$(aws configure get region --profile $PROFILE || echo "us-east-2")}
echo "📍 Using AWS Region: $AWS_REGION"

# Pass credentials to docker-compose
echo "📦 Starting containers..."
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN \
AWS_REGION=$AWS_REGION \
docker-compose up -d

echo "✅ Docker started with AWS SSO credentials!"
echo ""

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 5

# Start Amplify sandbox automatically
echo "🚀 Starting Amplify sandbox with identifier: $SANDBOX_ID"
docker-compose exec -d app sh -c "pnpm ampx sandbox --identifier $SANDBOX_ID"

echo ""
echo "✨ Everything is starting up!"
echo ""
echo "📊 Access points:"
echo "   - Next.js App: http://localhost:3002"
echo "   - Amplify Sandbox: http://localhost:3003" 
echo "   - GraphQL: http://localhost:4001"
echo ""
echo "📝 Useful commands:"
echo "   - View all logs: docker-compose logs -f app"
echo "   - View sandbox logs: docker-compose exec app sh -c 'cat .amplify/logs/sandbox.log'"
echo "   - Shell access: docker-compose exec app sh"
echo "   - Stop everything: ./docker/docker-stop.sh"
echo ""
echo "Note: Sandbox may take 2-3 minutes to fully start. Check logs if needed."