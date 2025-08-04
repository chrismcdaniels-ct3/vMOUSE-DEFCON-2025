# Unity WebGL Platform - Setup Guide

This guide will help you create a new Unity WebGL hosting platform using AWS Amplify Gen 2.

## Project Setup

### 1. Create Project Directory and Initialize

```bash
mkdir unity-webgl-platform
cd unity-webgl-platform

# Create Next.js app
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-pnpm
```

### 2. Install Dependencies

```bash
# AWS Amplify
pnpm add @aws-amplify/backend @aws-amplify/backend-cli aws-amplify

# UI Components (Radix UI)
pnpm add @radix-ui/react-slot @radix-ui/react-accordion @radix-ui/react-dialog
pnpm add @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select
pnpm add @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-tooltip

# Additional dependencies
pnpm add @remixicon/react recharts date-fns tailwind-variants clsx
pnpm add -D @types/node
```

### 3. Create Directory Structure

```bash
# Amplify directories
mkdir -p amplify/auth
mkdir -p amplify/data  
mkdir -p amplify/storage
mkdir -p amplify/functions/analytics
mkdir -p amplify/functions/unity-manager

# App directories
mkdir -p app/\(public\)/unity/\[id\]
mkdir -p app/\(admin\)/dashboard
mkdir -p app/\(admin\)/settings
mkdir -p app/api/unity-events

# Component directories
mkdir -p components/unity
mkdir -p components/ui
mkdir -p components/admin
mkdir -p components/analytics

# Other directories
mkdir -p lib
mkdir -p types
mkdir -p public/unity-builds
```

## Core Configuration Files

### amplify/backend.ts
```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
});
```

### amplify/auth/resource.ts
```typescript
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['ADMINS'],
});
```

### amplify/data/resource.ts
```typescript
import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  Entity: a
    .model({
      // Core keys
      pk: a.id().required(),
      sk: a.string().required(),
      
      // GSI keys
      gsi1pk: a.string(),
      gsi1sk: a.string(),
      gsi2pk: a.string(),
      gsi2sk: a.string(),
      
      // Metadata
      type: a.string().required(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),
      
      // Unity Page attributes
      name: a.string(),
      slug: a.string(),
      enabled: a.boolean(),
      s3Path: a.string(),
      config: a.json(),
      
      // Analytics attributes
      pageId: a.string(),
      sessionId: a.string(),
      eventType: a.string(),
      eventData: a.json(),
      
      // Session attributes
      startTime: a.datetime(),
      completed: a.boolean(),
      progress: a.float(),
      score: a.float(),
      feedback: a.string(),
    })
    .identifier(["pk", "sk"])
    .secondaryIndexes((index) => [
      index("gsi1pk").sortKeys(["gsi1sk"]).name("bySession"),
      index("gsi2pk").sortKeys(["gsi2sk"]).name("byType"),
    ])
    .authorization((allow) => [
      allow.groups(["ADMINS"]).to(["create", "read", "update", "delete"]),
      allow.guest().to(["read"]),
      allow.authenticated().to(["read"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
```

### amplify/storage/resource.ts
```typescript
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'unityWebGLStorage',
  access: (allow) => ({
    'unity-builds/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['ADMINS']).to(['read', 'write', 'delete'])
    ],
  })
});
```

### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "selector",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tremor: {
          brand: {
            faint: "#eff6ff",
            muted: "#bfdbfe", 
            subtle: "#60a5fa",
            DEFAULT: "#3b82f6",
            emphasis: "#1d4ed8",
            inverted: "#ffffff",
          },
          background: {
            muted: "#f9fafb",
            subtle: "#f3f4f6",
            DEFAULT: "#ffffff",
            emphasis: "#374151",
          },
          border: {
            DEFAULT: "#e5e7eb",
          },
          ring: {
            DEFAULT: "#e5e7eb",
          },
          content: {
            subtle: "#9ca3af",
            DEFAULT: "#6b7280",
            emphasis: "#374151",
            strong: "#111827",
            inverted: "#ffffff",
          },
        },
        // Dark mode
        "dark-tremor": {
          brand: {
            faint: "#0B1229",
            muted: "#172554",
            subtle: "#1e40af",
            DEFAULT: "#3b82f6",
            emphasis: "#60a5fa",
            inverted: "#030712",
          },
          background: {
            muted: "#131A2B",
            subtle: "#1f2937",
            DEFAULT: "#111827",
            emphasis: "#d1d5db",
          },
          border: {
            DEFAULT: "#374151",
          },
          ring: {
            DEFAULT: "#374151",
          },
          content: {
            subtle: "#6b7280",
            DEFAULT: "#9ca3af",
            emphasis: "#e5e7eb",
            strong: "#f9fafb",
            inverted: "#000000",
          },
        },
      },
      boxShadow: {
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        // dark
        "dark-tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "dark-tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "dark-tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      borderRadius: {
        "tremor-small": "0.375rem",
        "tremor-default": "0.5rem",
        "tremor-full": "9999px",
      },
      fontSize: {
        "tremor-label": ["0.75rem", { lineHeight: "1rem" }],
        "tremor-default": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-title": ["1.125rem", { lineHeight: "1.75rem" }],
        "tremor-metric": ["1.875rem", { lineHeight: "2.25rem" }],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}
export default config
```

### lib/utils.ts
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const focusRing = [
  "outline outline-offset-2 outline-0 focus-visible:outline-2",
  "outline-blue-500 dark:outline-blue-500",
];

export const hasErrorInput = [
  "ring-2",
  "border-red-500 dark:border-red-700",
  "ring-red-200 dark:ring-red-700/30",
];

export const focusInput = [
  "focus:ring-2",
  "focus:border-blue-500 focus:ring-blue-200",
  "dark:focus:border-blue-500 dark:focus:ring-blue-700/30",
];
```

## Next Steps

After setting up the project structure:

1. **Configure AWS Credentials**
   ```bash
   aws configure
   ```

2. **Start Development**
   ```bash
   # Terminal 1: Start Amplify sandbox
   npx ampx sandbox
   
   # Terminal 2: Start Next.js dev server
   pnpm run dev
   ```

3. **Create Unity Player Component**
   - See `components/unity/UnityPlayer.tsx` in the implementation

4. **Build Admin Dashboard**
   - Authentication flow
   - Page management interface
   - Analytics dashboard

5. **Deploy to AWS**
   ```bash
   npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
   ```

## Key Implementation Files

The following files need to be created for the core functionality:

- `app/page.tsx` - Landing page
- `app/(public)/unity/[id]/page.tsx` - Dynamic Unity pages
- `app/(admin)/layout.tsx` - Admin layout with auth
- `app/(admin)/dashboard/page.tsx` - Admin dashboard
- `components/unity/UnityPlayer.tsx` - Unity WebGL player
- `lib/unity-bridge.ts` - Unity-React communication
- `lib/amplify.ts` - Amplify client configuration

This guide provides the foundation for your Unity WebGL hosting platform. The setup script or these instructions will create a fully functional starting point that you can then build upon.