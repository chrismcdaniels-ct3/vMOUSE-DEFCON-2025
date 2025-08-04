#!/bin/bash

echo "📊 Unity WebGL Platform Docker Status"
echo "===================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Show container status
echo "📦 Container Status:"
docker-compose ps
echo ""

# Show resource usage
echo "💾 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" unity-webgl-platform
echo ""

# Check if app is responding
echo "🌐 Application Health:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002 | grep -q "200\|304"; then
    echo "   ✅ Next.js app is responding on http://localhost:3002"
else
    echo "   ❌ Next.js app is not responding on port 3002"
fi

# Show recent logs
echo ""
echo "📝 Recent logs (last 10 lines):"
docker-compose logs --tail 10 app