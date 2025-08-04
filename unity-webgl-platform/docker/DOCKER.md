# Docker Development Environment

This guide explains how to use Docker for developing the ABS Learning Center application.

## Quick Start

```bash
# Build and start the development environment
pnpm docker:dev

# In a separate terminal, access the container shell
pnpm docker:shell

# Inside the container, start Amplify sandbox
pnpm ampx sandbox
```

## Available Commands

- `pnpm docker:build` - Build the Docker image
- `pnpm docker:dev` - Start the development environment
- `pnpm docker:down` - Stop all containers
- `pnpm docker:rebuild` - Rebuild containers without cache
- `pnpm docker:shell` - Access container shell
- `pnpm docker:logs` - View container logs
- `pnpm docker:clean` - Remove all containers and volumes

## Benefits of Docker Development

1. **Consistent Environment**: Ensures all developers work with identical dependencies
2. **Claude Code Integration**: Better compatibility with AI-assisted development
3. **Isolated Dependencies**: No conflicts with local system packages
4. **Easy Cleanup**: Simple commands to reset the environment
5. **AWS CLI Pre-installed**: Ready for Amplify development

## Architecture

The Docker setup includes:

- **Multi-stage Dockerfile**: Optimized for both development and production
- **Hot Reloading**: Code changes reflect immediately
- **Volume Mounts**: Your local code is mounted into the container
- **Port Mapping**: All necessary ports exposed (3002 for Next.js, 3003 for Amplify, 20003, 4001 for GraphQL)
- **AWS Credentials**: Safely mounted from your host system

## Optional Services

The docker-compose file includes optional services that can be enabled:

```bash
# Start with LocalStack for AWS service emulation
docker-compose --profile localstack up

# This enables:
# - LocalStack (AWS services): http://localhost:4566
# - DynamoDB Admin UI: http://localhost:8001
```

## Troubleshooting

### Permission Issues
If you encounter permission errors, ensure your user owns the project directory:
```bash
sudo chown -R $(whoami):$(whoami) .
```

### Port Conflicts
If ports are already in use, stop the conflicting services or modify the ports in `docker-compose.yml`.

### AWS Credentials
Ensure your AWS credentials are properly configured on your host system:
```bash
aws configure
```

## Production Build

To test the production build:
```bash
docker build --target runner -t abs-learning-center:prod .
docker run -p 3002:3000 abs-learning-center:prod
```