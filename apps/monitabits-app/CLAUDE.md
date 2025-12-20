# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the monitabits-app application.

**IMPORTANT: Always refer to `.cursor/rules/` for development standards.**

## Application Overview

**monitabits-app** is a Next.js frontend application for tracking quit smoking progress. It runs on **port 3002** in the monorepo setup and uses the Next.js App Router architecture with Server Components and Server Actions.

## Essential Commands

### Development
- `bun run dev` - Start Next.js development server on port 3002
- `bun run build` - Build for production  
- `bun run start` - Start production server
- `bun run check:types` - Run TypeScript type checking

## Technology Stack

### Core Framework
- **Next.js 15** - React framework with App Router
- **React 19** - Modern React with Server Components
- **TypeScript** - Type-safe development

### UI & Styling
- **@repo/ui** - Shared component library (Atomic Design)
  - `@repo/ui/atoms` - Basic UI components (Button, Card, Input, etc.)
  - `@repo/ui/molecules` - Composed components (ActionButton, StatusCard, etc.)
- **Tailwind CSS** - Utility-first styling

### API Integration
- **@repo/monitabits-kubb** - Generated API client
  - `/server` - Server functions for Server Components
  - `/hooks` - SWR hooks for Client Components
  - `/types` - TypeScript types
  - `/zod` - Validation schemas

## Architecture

### Project Structure
```
apps/monitabits-app/
├── src/
│   ├── app/                        # App Router directory
│   │   ├── _components/           # Shared app components
│   │   │   └── providers.tsx      # React providers (SWR, themes)
│   │   ├── (dashboard)/           # Dashboard route group
│   │   │   ├── _components/       # Dashboard-specific components
│   │   │   │   └── pomodoro-timer.tsx  # Pomodoro timer component
│   │   │   ├── actions.ts         # Server Actions for timer operations
│   │   │   ├── page.tsx           # Dashboard page (Server Component)
│   │   │   ├── loading.tsx        # Loading UI
│   │   │   └── error.tsx          # Error boundary
│   │   ├── settings/              # Settings pages
│   │   │   ├── _components/
│   │   │   │   └── settings-form.tsx  # Client form component
│   │   │   ├── actions.ts         # Server Actions for settings
│   │   │   ├── page.tsx           # Settings page (Server Component)
│   │   │   ├── loading.tsx        # Loading UI
│   │   │   └── error.tsx          # Error boundary
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── styles.css             # Global styles (Tailwind)
│   │   ├── error.tsx              # Global error boundary
│   │   ├── global-error.tsx       # Root error boundary
│   │   └── not-found.tsx          # 404 page
│   ├── middleware.ts              # Device ID cookie middleware
│   └── utils/
│       ├── api-headers.ts         # Server-side API headers helper
│       └── register-sw.ts         # Service worker registration
├── public/
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service worker
├── next.config.ts                 # Next.js configuration
└── tsconfig.json                  # TypeScript configuration
```

### Server Components vs Client Components

#### Server Components (Default)
Use for initial data fetching and static content:

```typescript
// app/(dashboard)/page.tsx - Server Component
import { timerControllerGetCurrentTimer } from '@repo/monitabits-kubb/server';
import { getApiHeaders } from '../../utils/api-headers';
import { PomodoroTimer } from './_components/pomodoro-timer';

export default async function DashboardPage() {
  // Fetch data on the server
  const headers = await getApiHeaders();
  const data = await timerControllerGetCurrentTimer({ headers });
  
  return (
    <main>
      {/* Pass server data to client component */}
      <PomodoroTimer initialTimer={data?.timer ?? null} />
    </main>
  );
}
```

#### Client Components
Use for interactivity and real-time updates:

```typescript
'use client';

import { useTimerControllerGetCurrentTimer } from '@repo/monitabits-kubb/hooks';
import { Button, Card } from '@repo/ui/atoms';

export function PomodoroTimer({ initialTimer }) {
  // Real-time updates with SWR
  const { data, mutate } = useTimerControllerGetCurrentTimer({
    query: { refreshInterval: 5000 },
  });
  
  // Use server data as fallback
  const timer = data?.timer ?? initialTimer;
  
  return (
    <Card>
      {/* Timer display and controls */}
      <div>{timer?.remainingSeconds}</div>
      <Button onClick={handleStart}>Start</Button>
    </Card>
  );
}
```

#### Server Actions
Use for mutations triggered from client components:

```typescript
// app/(dashboard)/actions.ts
'use server';

import { timerControllerStartTimer, timerControllerPauseTimer } from '@repo/monitabits-kubb/server';
import { revalidatePath } from 'next/cache';
import { getApiHeaders } from '../../utils/api-headers';

export async function startTimer(type: 'work' | 'short_break' | 'long_break') {
  const headers = await getApiHeaders();
  await timerControllerStartTimer({ body: { type } }, { headers });
  revalidatePath('/');
}

export async function pauseTimer() {
  const headers = await getApiHeaders();
  await timerControllerPauseTimer({}, { headers });
  revalidatePath('/');
}
```

### API Headers Helper

Get device ID from cookies for server-side API calls:

```typescript
// utils/api-headers.ts
import { cookies } from 'next/headers';

export async function getApiHeaders(): Promise<{ 'X-Device-Id': string }> {
  const cookieStore = await cookies();
  const deviceId = cookieStore.get('monitabits_device_id')?.value ?? '';
  return { 'X-Device-Id': deviceId };
}
```

## Development Patterns

### Component Import Patterns

```typescript
// Server Components - use server functions
import { timerControllerGetCurrentTimer } from '@repo/monitabits-kubb/server';
import { Card, CardContent } from '@repo/ui/atoms';

// Client Components - use hooks
'use client';
import { useTimerControllerGetCurrentTimer } from '@repo/monitabits-kubb/hooks';
import { Button, Card } from '@repo/ui/atoms';
```

### Data Fetching Strategy

1. **Server Components** - Initial data fetch with server functions (timer state)
2. **Client Components** - Real-time updates with SWR hooks (5 second refresh interval)
3. **Hydration** - Pass server data as initial props to client components
4. **Server Actions** - Mutations (start, pause, resume, reset) with `revalidatePath` for cache invalidation

### Loading and Error States

```typescript
// loading.tsx - Shown during server component loading
export default function Loading() {
  return <div className="animate-pulse">Loading...</div>;
}

// error.tsx - Error boundary for route segment
'use client';
export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Streaming with Suspense

```typescript
import { Suspense } from 'react';

export default async function Page() {
  return (
    <main>
      {/* Fast initial content */}
      <Header />
      
      {/* Streamed content */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsLoader />
      </Suspense>
    </main>
  );
}

async function StatsLoader() {
  const stats = await fetchStats();
  return <Stats data={stats} />;
}
```

## PWA Support

The app is configured as a Progressive Web App:
- `manifest.json` - App metadata and icons
- `sw.js` - Service worker for offline support
- `appleWebApp` metadata in layout

## Integration with Monorepo

### Shared Dependencies
- **@repo/ui/atoms** - Basic UI components
- **@repo/ui/molecules** - Composed components
- **@repo/monitabits-kubb** - API client (server + hooks)
- **@repo/utils** - Shared utilities

### API Communication
- **Server-side**: Uses `@repo/monitabits-kubb/server` functions (timerControllerGetCurrentTimer)
- **Client-side**: Uses `@repo/monitabits-kubb/hooks` SWR hooks (useTimerControllerGetCurrentTimer)
- **Timer Operations**: Server actions for start, pause, resume, reset operations
- **API base URL**: Configured via `NEXT_PUBLIC_API_URL` environment variable

## Testing Patterns

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'bun:test';
import { StatusCard } from '@repo/ui/molecules';

describe('StatusCard', () => {
  it('renders locked state correctly', () => {
    render(<StatusCard status="locked">Locked content</StatusCard>);
    expect(screen.getByText('Locked content')).toBeInTheDocument();
  });
});
```

When working with this application, follow the Server Components first approach - fetch timer data on the server, pass to client components for interactivity. The Pomodoro timer component handles real-time countdown and timer controls. Use the generated API client appropriately: server functions for Server Components, SWR hooks for Client Components.
