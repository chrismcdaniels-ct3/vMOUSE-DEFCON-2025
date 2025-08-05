# Unity WebGL Platform

A modern web platform for hosting Unity WebGL applications with AWS Amplify Gen 2.

<!-- Last updated: Security patch applied -->

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
