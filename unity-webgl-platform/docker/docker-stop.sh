#!/bin/bash

echo "🛑 Stopping Unity WebGL Platform Docker Environment..."

# Stop containers
docker-compose down

echo "✅ Docker containers stopped"

# Optional: Clean up volumes (uncomment if needed)
# echo "🧹 Cleaning up volumes..."
# docker-compose down -v

echo "👋 Docker environment stopped"