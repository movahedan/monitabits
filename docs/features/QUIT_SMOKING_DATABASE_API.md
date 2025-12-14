# 🗄️ Pomodoro Timer Application - Database & API Design

> Complete database schema and secure API structure for the Pomodoro timer application.

## 📋 Table of Contents

- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Security Architecture](#-security-architecture)
- [Data Models](#-data-models)
- [API Response Formats](#-api-response-formats)
- [Error Handling](#-error-handling)

## 🗄️ Database Schema

### Technology Stack
- **Database**: PostgreSQL 15+
- **ORM**: Prisma (type-safe database access)
- **Location**: `apps/monitabits-api/prisma/`
- **Migrations**: `apps/monitabits-api/prisma/migrations/`

### Entity Relationship Diagram

```
┌─────────────────┐
│     Device      │
├─────────────────┤
│ id (PK)         │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:1
         │
┌────────▼────────┐
│     Timer       │
├─────────────────┤
│ id (PK)         │
│ deviceId (UK)  │
│ status          │
│ type            │
│ durationSeconds │
│ remainingSeconds│
│ startedAt       │
│ pausedAt        │
│ createdAt       │
│ updatedAt       │
└─────────────────┘

┌─────────────────┐
│     Device      │
├─────────────────┤
│ id (PK)         │
└────────┬────────┘
         │
         │ 1:1
         │
┌────────▼────────┐
│    Settings     │
├─────────────────┤
│ id (PK)         │
│ deviceId (UK)  │
│ workMinutes     │
│ shortBreakMinutes│
│ longBreakMinutes│
│ updatedAt       │
└─────────────────┘

┌─────────────────┐
│     Device      │
├─────────────────┤
│ id (PK)         │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│ PomodoroSession │
├─────────────────┤
│ id (PK)         │
│ deviceId (FK)  │
│ type            │
│ durationSeconds │
│ completedAt     │
│ createdAt       │
└─────────────────┘
```

### Table Definitions

#### Devices Table
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_devices_id ON devices(id);
```

#### Timers Table
```sql
CREATE TABLE timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID UNIQUE NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('idle', 'running', 'paused', 'completed')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('work', 'short_break', 'long_break')),
  duration_seconds INTEGER NOT NULL,
  remaining_seconds INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  paused_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_timers_device_id ON timers(device_id);
```

#### Settings Table
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID UNIQUE NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  work_minutes INTEGER NOT NULL DEFAULT 25 CHECK (work_minutes > 0 AND work_minutes <= 120),
  short_break_minutes INTEGER NOT NULL DEFAULT 5 CHECK (short_break_minutes > 0 AND short_break_minutes <= 60),
  long_break_minutes INTEGER NOT NULL DEFAULT 15 CHECK (long_break_minutes > 0 AND long_break_minutes <= 120),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_settings_device_id ON settings(device_id);
```

#### PomodoroSessions Table
```sql
CREATE TABLE pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('work', 'short_break', 'long_break')),
  duration_seconds INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pomodoro_sessions_device_id ON pomodoro_sessions(device_id);
CREATE INDEX idx_pomodoro_sessions_device_id_completed_at ON pomodoro_sessions(device_id, completed_at);
```

## 🔌 API Endpoints

### Base URL
```
Production: https://api.monitabits.com
Development: http://localhost:3003
```

### Authentication
Single-user app with device-based identification:
- Device ID generated client-side and stored locally
- Sent in `X-Device-Id` header with each request
- Server creates device record on first request

### Endpoint Structure

#### 1. Timer Management

##### GET `/api/timer/current`
Get current timer status.

**Request Headers**:
```
X-Device-Id: <device-id>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "timer": {
      "id": "uuid",
      "status": "idle" | "running" | "paused" | "completed",
      "type": "work" | "short_break" | "long_break",
      "durationSeconds": 1500,
      "remainingSeconds": 1200,
      "startedAt": "2024-01-01T12:00:00Z" | null,
      "pausedAt": "2024-01-01T12:10:00Z" | null
    }
  }
}
```

##### POST `/api/timer/start`
Start a new timer session.

**Request Headers**:
```
X-Device-Id: <device-id>
```

**Request Body**:
```json
{
  "type": "work" | "short_break" | "long_break"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "timer": {
      "id": "uuid",
      "status": "running",
      "type": "work",
      "durationSeconds": 1500,
      "remainingSeconds": 1500,
      "startedAt": "2024-01-01T12:00:00Z",
      "pausedAt": null
    }
  }
}
```

##### POST `/api/timer/pause`
Pause the currently running timer.

**Request Headers**:
```
X-Device-Id: <device-id>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "timer": {
      "id": "uuid",
      "status": "paused",
      "type": "work",
      "durationSeconds": 1500,
      "remainingSeconds": 1200,
      "startedAt": "2024-01-01T12:00:00Z",
      "pausedAt": "2024-01-01T12:10:00Z"
    }
  }
}
```

##### POST `/api/timer/resume`
Resume a paused timer.

**Request Headers**:
```
X-Device-Id: <device-id>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "timer": {
      "id": "uuid",
      "status": "running",
      "type": "work",
      "durationSeconds": 1500,
      "remainingSeconds": 1200,
      "startedAt": "2024-01-01T12:10:00Z",
      "pausedAt": null
    }
  }
}
```

##### POST `/api/timer/reset`
Reset the timer to idle state.

**Request Headers**:
```
X-Device-Id: <device-id>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "timer": {
      "id": "uuid",
      "status": "idle",
      "type": "work",
      "durationSeconds": 1500,
      "remainingSeconds": 1500,
      "startedAt": null,
      "pausedAt": null
    }
  }
}
```

#### 2. Settings

##### GET `/api/settings`
Get user settings.

**Request Headers**:
```
X-Device-Id: <device-id>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "workMinutes": 25,
    "shortBreakMinutes": 5,
    "longBreakMinutes": 15,
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

##### PUT `/api/settings`
Update user settings.

**Request Headers**:
```
X-Device-Id: <device-id>
```

**Request Body**:
```json
{
  "workMinutes": 30,
  "shortBreakMinutes": 5,
  "longBreakMinutes": 20
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "workMinutes": 30,
    "shortBreakMinutes": 5,
    "longBreakMinutes": 20,
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

#### 3. Statistics

##### GET `/api/statistics/summary`
Get user statistics summary.

**Request Headers**:
```
X-Device-Id: <device-id>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalCompleted": 45,
    "totalWorkSessions": 30,
    "totalShortBreaks": 10,
    "totalLongBreaks": 5,
    "totalTimeSeconds": 135000,
    "todayCount": 8
  }
}
```

## 🔒 Security Architecture

### Device Authentication

All requests require device identification via `X-Device-Id` header:

```typescript
// Device authentication guard
@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const deviceId = request.headers['x-device-id'];
    
    if (!deviceId) {
      throw new UnauthorizedException('Device ID required');
    }
    
    // Ensure device exists
    await this.prisma.device.upsert({
      where: { id: deviceId },
      update: {},
      create: { id: deviceId },
    });
    
    return true;
  }
}
```

### Timer State Management

Timer state is managed server-side to prevent manipulation:

- **Running timers**: Remaining time calculated on-the-fly based on `startedAt` timestamp
- **Paused timers**: Remaining time stored in database when paused
- **Completed timers**: Automatically transition to completed state when remaining time reaches 0
- **Session recording**: Completed timers are recorded in `PomodoroSession` table

## 📊 Data Models

### TypeScript Interfaces

```typescript
// Device model
interface Device {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Timer model
interface Timer {
  readonly id: string;
  readonly deviceId: string;
  readonly status: 'idle' | 'running' | 'paused' | 'completed';
  readonly type: 'work' | 'short_break' | 'long_break';
  readonly durationSeconds: number;
  readonly remainingSeconds: number;
  readonly startedAt: Date | null;
  readonly pausedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Settings model
interface Settings {
  readonly id: string;
  readonly deviceId: string;
  readonly workMinutes: number;
  readonly shortBreakMinutes: number;
  readonly longBreakMinutes: number;
  readonly updatedAt: Date;
}

// PomodoroSession model
interface PomodoroSession {
  readonly id: string;
  readonly deviceId: string;
  readonly type: 'work' | 'short_break' | 'long_break';
  readonly durationSeconds: number;
  readonly completedAt: Date;
  readonly createdAt: Date;
}
```

## 📤 API Response Formats

### Success Response
```typescript
interface SuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly timestamp?: string;
}
```

### Error Response
```typescript
interface ErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
  readonly timestamp: string;
  readonly path: string;
}
```

## ⚠️ Error Handling

### Error Codes

- `TIMER_NOT_RUNNING` (400): Timer is not in running state
- `TIMER_NOT_PAUSED` (400): Timer is not in paused state
- `INVALID_TIMER_TYPE` (400): Invalid timer type provided
- `SETTINGS_VALIDATION_FAILED` (400): Settings validation failed
- `DEVICE_NOT_FOUND` (404): Device not found
- `INTERNAL_SERVER_ERROR` (500): Server error

### Error Response Example
```json
{
  "success": false,
  "error": "TIMER_NOT_RUNNING",
  "message": "Timer is not running",
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00Z",
  "path": "/api/timer/pause"
}
```

## 🔗 Related Documentation

- [Project Proposal](./QUIT_SMOKING_PROPOSAL.md)
- [UX Guidelines](./QUIT_SMOKING_UX.md)
- [Frontend Structure](./QUIT_SMOKING_FRONTEND.md)
- [Design System Prompt](./QUIT_SMOKING_DESIGN_SYSTEM.md)

---

**Timer Management**: All timer operations are handled server-side to ensure accurate state management and prevent client-side manipulation. The timer automatically transitions to completed state when time expires, and completed sessions are recorded for statistics.