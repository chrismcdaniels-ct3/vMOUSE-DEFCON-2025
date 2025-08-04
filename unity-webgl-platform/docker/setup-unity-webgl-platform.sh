#!/bin/bash

# Unity WebGL Platform Setup Script
# This script creates a new Amplify Gen 2 project for hosting Unity WebGL applications

set -e  # Exit on error

echo "🚀 Setting up Unity WebGL Platform..."

# Check if running in the correct directory
if [ -z "$1" ]; then
    echo "Usage: ./setup-unity-webgl-platform.sh <project-directory>"
    echo "Example: ./setup-unity-webgl-platform.sh /Users/yourname/projects/unity-webgl-platform"
    exit 1
fi

PROJECT_DIR="$1"

# Create project directory
echo "📁 Creating project directory at $PROJECT_DIR..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Initialize Next.js with TypeScript and Tailwind
echo "⚡ Creating Next.js application..."
npx create-next-app@latest . \
    --typescript \
    --tailwind \
    --app \
    --no-src-dir \
    --import-alias "@/*" \
    --use-pnpm \
    --no-git

# Install additional dependencies
echo "📦 Installing additional dependencies..."
pnpm add @aws-amplify/backend @aws-amplify/backend-cli aws-amplify
pnpm add @radix-ui/react-slot @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-tooltip
pnpm add @remixicon/react recharts date-fns
pnpm add -D @types/node

# Create project structure
echo "🏗️ Creating project structure..."

# Create Amplify directories
mkdir -p amplify/auth
mkdir -p amplify/data
mkdir -p amplify/storage
mkdir -p amplify/functions/analytics
mkdir -p amplify/functions/unity-manager

# Create app directories
mkdir -p app/\(public\)/unity/\[id\]
mkdir -p app/\(admin\)
mkdir -p app/\(admin\)/dashboard
mkdir -p app/\(admin\)/settings
mkdir -p app/api/unity-events

# Create component directories
mkdir -p components/unity
mkdir -p components/ui
mkdir -p components/admin
mkdir -p components/analytics

# Create lib directory
mkdir -p lib

# Create types directory
mkdir -p types

# Create public directories for Unity
mkdir -p public/unity-builds

# Create the amplify backend configuration
cat > amplify/backend.ts << 'EOF'
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { analyticsHandler } from './functions/analytics/resource';
import { unityManager } from './functions/unity-manager/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  analyticsHandler,
  unityManager,
});

// Grant permissions
backend.data.resources.tables["Entity"].grantReadWriteData(backend.analyticsHandler.resources.lambda);
backend.data.resources.tables["Entity"].grantReadWriteData(backend.unityManager.resources.lambda);
backend.storage.resources.bucket.grantRead(backend.auth.resources.unauthenticatedUserIamRole);
EOF

# Create amplify.yml for CI/CD
cat > amplify.yml << 'EOF'
version: 1
applications:
  - appRoot: .
    frontend:
      phases:
        preBuild:
          commands:
            - npm install -g pnpm
            - pnpm install
        build:
          commands:
            - pnpm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - .next/cache/**/*
          - node_modules/**/*
    buildSpec: |
      version: 1
      applications:
        - frontend:
            phases:
              preBuild:
                commands:
                  - npm install -g pnpm
                  - pnpm install
              build:
                commands:
                  - pnpm run build
            artifacts:
              baseDirectory: .next
              files:
                - '**/*'
            cache:
              paths:
                - node_modules/**/*
          appRoot: .
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# amplify
amplify_outputs.json
.amplify
amplify/build
amplify/backend/build
dist/

# Unity builds (large files)
public/unity-builds/**/*
!public/unity-builds/.gitkeep
EOF

# Create .gitkeep for unity-builds
touch public/unity-builds/.gitkeep

# Create README
cat > README.md << 'EOF'
# Unity WebGL Platform

A modern web platform for hosting Unity WebGL applications with AWS Amplify Gen 2.

## Features

- 🎮 Multiple Unity WebGL applications
- 🔐 Admin authentication and dashboard
- 📊 Analytics and completion tracking
- 🌓 Light/dark mode support
- ☁️ AWS Amplify Gen 2 backend
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- AWS Account
- AWS CLI configured

### Development

```bash
# Install dependencies
pnpm install

# Start Amplify sandbox (Terminal 1)
npx ampx sandbox

# Start development server (Terminal 2)
pnpm run dev
```

### Deployment

```bash
# Deploy to AWS
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
```

## Project Structure

```
├── amplify/          # Backend configuration
├── app/              # Next.js app router
│   ├── (public)/     # Public pages (no auth)
│   └── (admin)/      # Admin pages (auth required)
├── components/       # React components
├── lib/              # Utilities
└── public/           # Static assets
```

## Unity Integration

Place your Unity WebGL builds in `public/unity-builds/` or upload via admin dashboard.

## License

MIT
EOF

# Create environment variables template
cat > .env.example << 'EOF'
# Amplify
NEXT_PUBLIC_AWS_REGION=us-east-1

# Unity Configuration
NEXT_PUBLIC_UNITY_LOADER_URL=/unity-builds/Build/UnityLoader.js

# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true
EOF

# Initialize git
git init
git add .
git commit -m "Initial commit: Unity WebGL Platform setup"

echo "✅ Setup complete! Unity WebGL Platform created at $PROJECT_DIR"
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_DIR"
echo "2. Run 'pnpm install' to ensure all dependencies are installed"
echo "3. Configure your AWS credentials"
echo "4. Run 'npx ampx sandbox' to start the backend"
echo "5. Run 'pnpm run dev' to start the development server"