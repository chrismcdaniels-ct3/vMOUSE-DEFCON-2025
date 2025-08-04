# Docker Strategy Adaptation Guide

This Docker setup was copied from the ABS Learning Center project. Here's what you need to modify:

## Required Changes

1. **Update Application Name**
   - In `Dockerfile`: Update WORKDIR and container names
   - In `docker-compose.yml`: Change `abs-learning-center` to `unity-webgl-platform`
   - In `package.json`: Update the docker:build script to use your app name

2. **Adjust Ports**
   - Current setup uses ports 3001, 3003, 20003, 4001
   - Modify if these conflict with your existing services

3. **Environment Variables**
   - Update AWS credentials and region if needed
   - Add any Unity WebGL specific environment variables

4. **Dependencies**
   - The Dockerfile includes AWS Amplify CLI - remove if not needed
   - Add any Unity WebGL build tools you require

5. **Remove Amplify-Specific Elements** (if not using Amplify)
   - Remove Amplify CLI installation from Dockerfile
   - Remove Amplify sandbox ports from docker-compose.yml
   - Update the startup commands

## Quick Start

1. Add the Docker scripts from `docker-scripts.json` to your `package.json`
2. Update the application name throughout the files
3. Run `pnpm docker:build` to build the image
4. Run `pnpm docker:dev` to start the development environment

## Notes

- The multi-stage Dockerfile pattern is preserved for optimization
- Hot reloading is configured for development
- AWS credentials are mounted from your host system
- LocalStack integration is available for AWS service emulation
