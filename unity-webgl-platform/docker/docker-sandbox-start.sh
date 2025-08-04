#!/bin/bash

echo "🚀 Starting Amplify Sandbox with identifier 'jack1' in Docker..."

# Check if container is running
if ! docker ps | grep -q unity-webgl-platform; then
    echo "❌ Docker container is not running. Please run ./docker-sso-start.sh first"
    exit 1
fi

echo "📦 Starting Amplify sandbox inside Docker container..."
echo "   Identifier: jack1"
echo "   This will create a separate sandbox environment"
echo ""

# Run sandbox with identifier
docker-compose exec app sh -c "pnpm ampx sandbox --identifier jack1"