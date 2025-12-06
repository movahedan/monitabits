# 🎨 Cigarette Quitting Application - Frontend Structure

> Frontend routes, features, and app-specific architecture for the Next.js application.

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
│   │   ├── page.tsx              # Main dashboard
│   │   ├── settings/
│   │   │   └── page.tsx          # Settings page
│   │   └── layout.tsx            # Root layout
│   ├── components/
│   │   ├── features/
│   │   │   ├── dashboard/
│   │   │   │   ├── StatusCard.tsx
│   │   │   │   ├── CountdownTimer.tsx
│   │   │   │   ├── ActionButton.tsx
│   │   │   │   └── ProgressMetrics.tsx
│   │   │   ├── settings/
│   │   │   │   └── SettingsForm.tsx
│   │   │   └── reflection/
│   │   │       └── ReflectionModal.tsx
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── sessions.ts
│   │   │   ├── actions.ts
│   │   │   ├── settings.ts
│   │   │   ├── reflections.ts
│   │   │   └── stats.ts
│   │   ├── hooks/
│   │   │   ├── useSession.ts
│   │   │   ├── useSettings.ts
│   │   │   ├── useTimeSync.ts
│   │   │   └── useAutoSave.ts
│   │   └── utils/
│   │       ├── time.ts
│   │       └── device.ts
│   └── types/
│       ├── session.ts
│       ├── settings.ts
│       └── api.ts
```

## 🛣️ Routes

### `/` - Main Dashboard
- Shows current session status (locked/active)
- Displays countdown timer or time ahead
- Action buttons based on state
- Auto-save check-ins on mount

### `/settings` - Settings Page
- Lockdown period input (minutes)
- Save settings functionality

## 🧩 Feature Components

### Dashboard Components

**StatusCard** - Displays current state (locked/active) with appropriate styling

**CountdownTimer** - Real-time countdown display (HH:MM:SS format)

**ActionButton** - Two variants:
- `cheat`: "I Cheated and Dishonored Myself" (when blocked)
- `harm`: "I'm Choosing to Harm Myself" (when active)

**ProgressMetrics** - Shows time saved, streak, and statistics

### Settings Components

**SettingsForm** - Form with lockdown minutes input and save functionality

### Reflection Components

**ReflectionModal** - Modal that appears periodically with reflection questions

## 🔄 Custom Hooks

### `useSession()`
- Fetches current session status
- Auto-refreshes every 30 seconds
- Returns: `{ session, loading, error, refresh }`

### `useSettings()`
- Manages settings state
- Update settings functionality
- Returns: `{ settings, loading, error, updateSettings }`

### `useTimeSync()`
- Syncs client time with server
- Runs every minute
- Returns: `{ isSynced, lastSync, error, sync }`

### `useAutoSave()`
- Auto check-in on mount
- Check-in when app becomes visible
- Periodic check-in every 5 minutes

## 🔌 API Client

### Client Setup
- Device ID management (localStorage)
- Automatic headers: `X-Device-Id`, `X-Client-Time`, `X-Timezone-Offset`, `X-Timezone-Name`
- Error handling

### API Functions

**Sessions**
- `getCurrentSession()` - GET `/api/sessions/current`
- `createCheckIn()` - POST `/api/sessions/check-in`

**Actions**
- `logCheatAction()` - POST `/api/actions/cheat`
- `logHarmAction()` - POST `/api/actions/harm`

**Settings**
- `getSettings()` - GET `/api/settings`
- `updateSettings()` - PUT `/api/settings`

**Reflections**
- `getPendingReflection()` - GET `/api/reflections/pending`
- `answerReflection()` - POST `/api/reflections/:id/answer`

**Statistics**
- `getStats()` - GET `/api/stats`

## 🛠️ Utilities

### `lib/utils/time.ts`
- `formatTime(seconds)` - Format seconds to HH:MM:SS or MM:SS
- `getClientTimeInfo()` - Get client time, timezone offset, and timezone name

### `lib/utils/device.ts`
- `getOrCreateDeviceId()` - Get or generate device ID from localStorage

## 🔗 Related Documentation

- [Project Proposal](./QUIT_SMOKING_PROPOSAL.md)
- [UX Guidelines](./QUIT_SMOKING_UX.md)
- [Database & API Design](./QUIT_SMOKING_DATABASE_API.md)
- [Design System Prompt](./QUIT_SMOKING_DESIGN_SYSTEM.md)

---

**Note**: Using standard Next.js App Router, Tailwind CSS, and shadcn/ui components. Focus on app-specific logic and structure.
