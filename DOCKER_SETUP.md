# Docker Setup for Unity WebGL Platform

This project is configured to run in a Docker environment for consistent development across teams.

## Quick Start

```bash
# 1. Start the Docker environment
pnpm docker:dev

# 2. In another terminal, access the container
pnpm docker:shell

# 3. Inside the container, start Amplify sandbox (if needed)
pnpm ampx sandbox
```

## Port Configuration

The application runs on port **3002** (changed from the default 3000):

- **Next.js App**: http://localhost:3002
- **Amplify Sandbox**: http://localhost:3003  
- **GraphQL Endpoint**: http://localhost:4001
- **Amplify WebSocket**: http://localhost:20003

## Docker Architecture

### File Structure
```
unity-webgl-platform/
├── Dockerfile              # Multi-stage build configuration
├── docker-compose.yml      # Service orchestration
├── docker/                 # Docker utilities and docs
│   ├── docker-start.sh    # Start script
│   ├── docker-stop.sh     # Stop script
│   ├── docker-status.sh   # Status check script
│   └── DOCKER.md          # Detailed documentation
└── package.json           # Includes docker:* scripts
```

### Key Features

1. **Multi-stage Dockerfile**
   - Development stage with hot-reloading
   - Production-optimized build
   - Pre-installed AWS CLI and Amplify tools

2. **Volume Mounts**
   - Source code synced for hot-reloading
   - AWS credentials mounted securely
   - Persistent pnpm store for faster installs

3. **Optional Services**
   - LocalStack for AWS service emulation
   - DynamoDB Admin UI

## Common Commands

```bash
# Docker management
pnpm docker:build    # Build Docker image
pnpm docker:dev      # Start development environment
pnpm docker:down     # Stop all containers
pnpm docker:rebuild  # Rebuild without cache
pnpm docker:shell    # Access container shell
pnpm docker:logs     # View container logs
pnpm docker:clean    # Remove containers and volumes

# Inside container
pnpm dev            # Start Next.js dev server
pnpm ampx sandbox   # Start Amplify sandbox
pnpm build          # Build for production
```

## Troubleshooting

### Port Already in Use
If port 3002 is already in use:
1. Stop the conflicting service, or
2. Modify the port in `docker-compose.yml`

### Permission Issues
```bash
# Fix ownership issues
sudo chown -R $(whoami):$(whoami) .
```

### AWS Credentials
Ensure AWS credentials are configured on your host:
```bash
aws configure
```

## Production Build

To test the production Docker build:
```bash
docker build --target runner -t unity-webgl-platform:prod .
docker run -p 3002:3000 unity-webgl-platform:prod
```

For more detailed information, see `docker/DOCKER.md`.