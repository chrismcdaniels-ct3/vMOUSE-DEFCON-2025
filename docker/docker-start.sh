#!/bin/bash

echo "🚀 Starting Unity WebGL Platform Docker Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"

# Build and start containers
echo "📦 Building Docker images..."
docker-compose build

echo "🔧 Starting containers..."
docker-compose up -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to start..."
sleep 5

# Show container status
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "✨ Docker environment is ready!"
echo ""
echo "🌐 Access points:"
echo "   - Next.js App: http://localhost:3002"
echo "   - Amplify Sandbox: http://localhost:3003"
echo "   - GraphQL: http://localhost:4001"
echo ""
echo "📝 Useful commands:"
echo "   - View logs: docker-compose logs -f app"
echo "   - Shell access: docker-compose exec app sh"
echo "   - Stop containers: docker-compose down"
echo "   - Restart app: docker-compose restart app"
echo ""
echo "💡 To run Amplify sandbox inside container:"
echo "   docker-compose exec app pnpm ampx sandbox"