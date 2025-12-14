# 🎨 Pomodoro Timer Application - Frontend Structure

> Frontend routes, features, and app-specific architecture for the Next.js Pomodoro timer application.

## 📋 Table of Contents

- [Project Structure](#-project-structure)
- [Routes](#-routes)
- [Feature Components](#-feature-components)
- [Custom Hooks](#-custom-hooks)
- [API Client](#-api-client)
- [Utilities](#-utilities)

## 📁 Project Structure

```
apps/monitabits-app/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── _components/
│   │   │   │   └── pomodoro-timer.tsx    # Main Pomodoro timer component
│   │   │   ├── actions.ts                # Server Actions for timer operations
│   │   │   ├── page.tsx                  # Dashboard page (Server Component)
│   │   │   ├── loading.tsx               # Loading UI
│   │   │   └── error.tsx                 # Error boundary
│   │   ├── settings/
│   │   │   ├── _components/
│   │   │   │   └── settings-form.tsx     # Settings form component
│   │   │   ├── actions.ts                # Server Actions for settings
│   │   │   ├── page.tsx                  # Settings page (Server Component)
│   │   │   ├── loading.tsx               # Loading UI
│   │   │   └── error.tsx                 # Error boundary
│   │   ├── layout.tsx                    # Root layout with providers
│   │   ├── styles.css                    # Global styles (Tailwind)
│   │   ├── error.tsx                     # Global error boundary
│   │   ├── global-error.tsx              # Root error boundary
│   │   └── not-found.tsx                 # 404 page
│   ├── middleware.ts                     # Device ID cookie middleware
│   └── utils/
│       ├── api-headers.ts                # Server-side API headers helper
│       └── register-sw.ts               # Service worker registration
├── public/
│   ├── manifest.json                     # PWA manifest
│   └── sw.js                            # Service worker
├── next.config.ts                        # Next.js configuration
└── tsconfig.json                         # TypeScript configuration
```

## 🛣️ Routes

### `/` - Main Dashboard
- Displays Pomodoro timer component
- Shows current timer status (idle, running, paused, completed)
- Timer controls based on state
- Real-time countdown for running timers

### `/settings` - Settings Page
- Pomodoro timer duration settings:
  - Work minutes (1-120)
  - Short break minutes (1-60)
  - Long break minutes (1-120)
- Save settings functionality

## 🧩 Feature Components

### Dashboard Components

**PomodoroTimer** - Main timer component with:
- Timer display (MM:SS format)
- Timer type indicator (Work, Short Break, Long Break)
- State-based controls:
  - **Idle**: Start Work, Start Short Break, Start Long Break buttons
  - **Running**: Pause, Reset buttons
  - **Paused**: Resume, Reset buttons
  - **Completed**: Start New button
- Real-time countdown updates (1 second intervals)
- Server-side data fetching with SWR for real-time updates

### Settings Components

**SettingsForm** - Form component with:
- Work minutes input (1-120)
- Short break minutes input (1-60)
- Long break minutes input (1-120)
- Save functionality with validation

## 🔄 Custom Hooks

### Timer Hooks

The application uses generated SWR hooks from `@repo/monitabits-kubb`:

- `useTimerControllerGetCurrentTimer()` - Fetches current timer status
  - Auto-refreshes every 5 seconds
  - Returns: `{ data, error, isLoading, mutate }`

### Settings Hooks

- `useSettingsControllerGetSettings()` - Fetches current settings
- `useSettingsControllerUpdateSettings()` - Updates settings

## 🔌 API Client

### Client Setup
- Device ID management (cookies via middleware)
- Automatic headers: `X-Device-Id`
- Error handling

### API Functions

**Timer Operations**
- `getCurrentTimer()` - GET `/api/timer/current`
- `startTimer(type)` - POST `/api/timer/start`
- `pauseTimer()` - POST `/api/timer/pause`
- `resumeTimer()` - POST `/api/timer/resume`
- `resetTimer()` - POST `/api/timer/reset`

**Settings**
- `getSettings()` - GET `/api/settings`
- `updateSettings()` - PUT `/api/settings`

**Statistics**
- `getStatisticsSummary()` - GET `/api/statistics/summary`

### Server Actions Pattern

Server Actions are used for timer mutations:

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

## 🛠️ Utilities

### `utils/api-headers.ts`
Server-side helper to get API headers from cookies:

```typescript
import { cookies } from 'next/headers';

export async function getApiHeaders(): Promise<{ 'X-Device-Id': string }> {
  const cookieStore = await cookies();
  const deviceId = cookieStore.get('monitabits_device_id')?.value ?? '';
  return { 'X-Device-Id': deviceId };
}
```

### `middleware.ts`
Device ID cookie management:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const deviceId = request.cookies.get('monitabits_device_id')?.value;
  
  if (!deviceId) {
    // Generate device ID and set cookie
    const newDeviceId = crypto.randomUUID();
    const response = NextResponse.next();
    response.cookies.set('monitabits_device_id', newDeviceId);
    return response;
  }
  
  return NextResponse.next();
}
```

## 🎯 Timer State Management

### Timer States

1. **Idle**: Timer is not running, ready to start
2. **Running**: Timer is actively counting down
3. **Paused**: Timer is stopped but can be resumed
4. **Completed**: Timer has finished, session recorded

### Timer Flow

```
Idle → (start) → Running → (pause) → Paused → (resume) → Running
  ↑                                                              ↓
  └────────────────────────── (reset) ←──────────────────────────┘
                                                                    ↓
                                                              Completed
                                                                    ↓
                                                              (start new) → Idle
```

### Real-time Updates

- **Server Component**: Fetches initial timer state on page load
- **Client Component**: Uses SWR hook with 5-second refresh interval
- **Local State**: Maintains local countdown for smooth UI updates (1-second intervals)
- **Synchronization**: Local countdown syncs with server data every 5 seconds

## 🔗 Related Documentation

- [Project Proposal](./QUIT_SMOKING_PROPOSAL.md)
- [UX Guidelines](./QUIT_SMOKING_UX.md)
- [Database & API Design](./QUIT_SMOKING_DATABASE_API.md)
- [Design System Prompt](./QUIT_SMOKING_DESIGN_SYSTEM.md)

---

**Note**: Using standard Next.js App Router, Tailwind CSS, and shadcn/ui components. The Pomodoro timer component handles real-time countdown and state management with server-side timer operations.