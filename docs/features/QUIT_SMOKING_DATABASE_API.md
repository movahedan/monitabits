# 🗄️ Cigarette Quitting Application - Database & API Design

> Complete database schema and secure API structure for the quit smoking accountability application.

## 📋 Table of Contents

- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Security Architecture](#-security-architecture)
- [Time Validation System](#-time-validation-system)
- [Data Models](#-data-models)
- [API Response Formats](#-api-response-formats)
- [Error Handling](#-error-handling)

## 🗄️ Database Schema

### Technology Stack
- **Database**: PostgreSQL 15+
- **ORM**: TypeORM or Prisma (recommended: Prisma for type safety)
- **Migrations**: Database version control
- **Backups**: Automated daily backups

### Entity Relationship Diagram

```
┌─────────────────┐
│     User        │
├─────────────────┤
│ id (PK)         │
│ deviceId (UK)   │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│    Session      │
├─────────────────┤
│ id (PK)         │
│ userId (FK)     │
│ startTime       │
│ endTime         │
│ status          │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│   CheckIn       │
├─────────────────┤
│ id (PK)         │
│ sessionId (FK)  │
│ type            │
│ serverTime      │
│ clientTime      │
│ timezone        │
│ createdAt       │
└─────────────────┘

┌─────────────────┐
│    Settings     │
├─────────────────┤
│ id (PK)         │
│ userId (FK)     │
│ lockdownMinutes │
│ updatedAt       │
└─────────────────┘

┌─────────────────┐
│   Reflection    │
├─────────────────┤
│ id (PK)         │
│ userId (FK)     │
│ question        │
│ answer          │
│ createdAt       │
└─────────────────┘

┌─────────────────┐
│  SecurityLog    │
├─────────────────┤
│ id (PK)         │
│ userId (FK)     │
│ eventType       │
│ details         │
│ serverTime      │
│ clientTime      │
│ timezone        │
│ createdAt       │
└─────────────────┘
```

### Table Definitions

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_device_id ON users(device_id);
```

#### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'locked', 'completed')),
  lockdown_minutes INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_start_time ON sessions(start_time);
```

#### CheckIns Table
```sql
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('cheat', 'harm', 'check_in', 'reflection')),
  server_time TIMESTAMP WITH TIME ZONE NOT NULL,
  client_time TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone_offset INTEGER NOT NULL,
  timezone_name VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_check_ins_session_id ON check_ins(session_id);
CREATE INDEX idx_check_ins_type ON check_ins(type);
CREATE INDEX idx_check_ins_server_time ON check_ins(server_time);
```

#### Settings Table
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lockdown_minutes INTEGER NOT NULL DEFAULT 60 CHECK (lockdown_minutes > 0 AND lockdown_minutes <= 10080),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_settings_user_id ON settings(user_id);
```

#### Reflections Table
```sql
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_reflections_created_at ON reflections(created_at);
```

**Note**: Reflection questions are generated dynamically by the backend based on user activity patterns, timing, and progress. Questions are not stored in a separate table but are created on-demand when the system determines a reflection prompt is appropriate.

#### SecurityLogs Table
```sql
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('time_manipulation', 'timezone_change', 'suspicious_activity', 'validation_failure')),
  details JSONB NOT NULL,
  server_time TIMESTAMP WITH TIME ZONE NOT NULL,
  client_time TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone_offset INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at);
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
- Server creates user record on first request

### Endpoint Structure

#### 1. Session Management

##### GET `/api/sessions/current`
Get current active session status.

**Request Headers**:
```
X-Device-Id: <device-id>
X-Client-Time: <ISO-8601-timestamp>
X-Timezone-Offset: <minutes>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "status": "locked" | "active",
      "startTime": "2024-01-01T12:00:00Z",
      "endTime": "2024-01-01T13:00:00Z" | null,
      "lockdownMinutes": 60,
      "timeRemaining": 3600, // seconds
      "timeAhead": 7200 // seconds (if active)
    },
    "user": {
      "id": "uuid",
      "totalTimeSaved": 86400, // seconds
      "currentStreak": 3,
      "lastRelapse": "2024-01-01T10:00:00Z"
    }
  }
}
```

##### POST `/api/sessions/check-in`
Create a check-in (app open, background sync).

**Request Body**:
```json
{
  "clientTime": "2024-01-01T12:00:00Z",
  "timezoneOffset": -300,
  "timezoneName": "America/New_York"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "checkIn": {
      "id": "uuid",
      "type": "check_in",
      "serverTime": "2024-01-01T12:00:01Z",
      "createdAt": "2024-01-01T12:00:01Z"
    },
    "session": {
      // Updated session data
    }
  }
}
```

#### 2. Actions

##### POST `/api/actions/cheat`
Log "I cheated" action (when blocked).

**Request Body**:
```json
{
  "clientTime": "2024-01-01T12:00:00Z",
  "timezoneOffset": -300,
  "timezoneName": "America/New_York"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "action": {
      "id": "uuid",
      "type": "cheat",
      "serverTime": "2024-01-01T12:00:01Z",
      "consequences": {
        "message": "Action logged. Consequences will apply.",
        "additionalLockdown": 0 // minutes added
      }
    },
    "session": {
      // Updated session data
    }
  }
}
```

##### POST `/api/actions/harm`
Log "I'm choosing to harm myself" action (when active).

**Request Body**:
```json
{
  "clientTime": "2024-01-01T12:00:00Z",
  "timezoneOffset": -300,
  "timezoneName": "America/New_York"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "action": {
      "id": "uuid",
      "type": "harm",
      "serverTime": "2024-01-01T12:00:01Z",
      "lockdownStarted": true
    },
    "session": {
      "status": "locked",
      "startTime": "2024-01-01T12:00:01Z",
      "endTime": "2024-01-01T13:00:01Z",
      "timeRemaining": 3600
    }
  }
}
```

#### 3. Settings

##### GET `/api/settings`
Get user settings.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "lockdownMinutes": 60,
    "updatedAt": "2024-01-01T10:00:00Z"
  }
}
```

##### PUT `/api/settings`
Update user settings.

**Request Body**:
```json
{
  "lockdownMinutes": 120
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "lockdownMinutes": 120,
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

#### 4. Reflections

##### GET `/api/reflections/pending`
Get pending reflection questions.

**Note**: Questions are generated dynamically based on user activity patterns and timing. The system determines when to prompt for reflection.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "hasPending": true,
    "question": {
      "id": "uuid",
      "text": "What have you done?",
      "type": "progress"
    }
  }
}
```

**Response** (200 OK - No pending):
```json
{
  "success": true,
  "data": {
    "hasPending": false
  }
}
```

##### POST `/api/reflections/:id/answer`
Submit reflection answer.

**Request Body**:
```json
{
  "answer": "I've been doing well, avoided smoking for 3 days"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "reflection": {
      "id": "uuid",
      "question": "What have you done?",
      "answer": "I've been doing well, avoided smoking for 3 days",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  }
}
```

#### 5. Statistics

##### GET `/api/stats`
Get user statistics.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalTimeSaved": 86400, // seconds
    "currentStreak": 3,
    "longestStreak": 7,
    "totalCheckIns": 45,
    "totalActions": 12,
    "averageTimeBetweenActions": 7200, // seconds
    "lastRelapse": "2024-01-01T10:00:00Z"
  }
}
```

## 🔒 Security Architecture

### Time Validation System

#### Server-Side Time Authority
All time-sensitive operations use server time as the source of truth.

```typescript
// Time validation service
class TimeValidationService {
  /**
   * Validates client time against server time
   * @param clientTime - Client-reported timestamp
   * @param timezoneOffset - Client timezone offset in minutes
   * @returns Validation result with security flags
   */
  validateClientTime(
    clientTime: Date,
    timezoneOffset: number
  ): TimeValidationResult {
    const serverTime = new Date();
    const clientTimeDate = new Date(clientTime);
    
    // Calculate time difference
    const timeDiff = Math.abs(serverTime.getTime() - clientTimeDate.getTime());
    
    // Allow 5 second tolerance for network delay
    const tolerance = 5000;
    
    // Check for time manipulation
    const isManipulated = timeDiff > tolerance;
    
    // Check for timezone changes (compare with stored timezone)
    const timezoneChanged = this.detectTimezoneChange(timezoneOffset);
    
    // Check for backward time jumps
    const isBackwardJump = clientTimeDate.getTime() < this.getLastClientTime();
    
    return {
      isValid: !isManipulated && !isBackwardJump,
      isManipulated,
      isBackwardJump,
      timezoneChanged,
      serverTime,
      clientTime: clientTimeDate,
      timeDifference: timeDiff,
    };
  }
}
```

#### NTP Synchronization
Server time synchronized with NTP servers for accuracy.

```typescript
// NTP time service
class NTPTimeService {
  /**
   * Get accurate server time from NTP
   */
  async getAccurateTime(): Promise<Date> {
    // Use system NTP or external NTP service
    // Fallback to system time if NTP unavailable
    return new Date();
  }
}
```

### Request Validation Middleware

```typescript
// Time validation middleware
@Injectable()
export class TimeValidationMiddleware implements NestMiddleware {
  constructor(
    private timeValidationService: TimeValidationService,
    private securityLogService: SecurityLogService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const clientTime = req.headers['x-client-time'] as string;
    const timezoneOffset = parseInt(req.headers['x-timezone-offset'] as string, 10);
    
    if (clientTime && !isNaN(timezoneOffset)) {
      const validation = this.timeValidationService.validateClientTime(
        new Date(clientTime),
        timezoneOffset
      );
      
      if (!validation.isValid) {
        // Log security event
        this.securityLogService.log({
          eventType: 'time_manipulation',
          details: validation,
          clientTime: new Date(clientTime),
          serverTime: new Date(),
          timezoneOffset,
        });
        
        // Return error or flag request
        return res.status(400).json({
          success: false,
          error: 'TIME_VALIDATION_FAILED',
          message: 'Time validation failed. Please ensure your device time is correct.',
        });
      }
    }
    
    next();
  }
}
```

### Device Fingerprinting

```typescript
// Device identification
class DeviceService {
  /**
   * Generate or retrieve device ID
   */
  async getOrCreateDevice(deviceId: string): Promise<User> {
    let user = await this.userRepository.findOne({ deviceId });
    
    if (!user) {
      user = await this.userRepository.create({ deviceId });
      await this.settingsRepository.create({
        userId: user.id,
        lockdownMinutes: 60, // default
      });
    }
    
    return user;
  }
}
```

## 📊 Data Models

### TypeScript Interfaces

```typescript
// User model
interface User {
  readonly id: string;
  readonly deviceId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Session model
interface Session {
  readonly id: string;
  readonly userId: string;
  readonly startTime: Date;
  readonly endTime: Date | null;
  readonly status: 'active' | 'locked' | 'completed';
  readonly lockdownMinutes: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// CheckIn model
interface CheckIn {
  readonly id: string;
  readonly sessionId: string;
  readonly type: 'cheat' | 'harm' | 'check_in' | 'reflection';
  readonly serverTime: Date;
  readonly clientTime: Date;
  readonly timezoneOffset: number;
  readonly timezoneName: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: Date;
}

// Settings model
interface Settings {
  readonly id: string;
  readonly userId: string;
  readonly lockdownMinutes: number;
  readonly updatedAt: Date;
}

// Reflection model
interface Reflection {
  readonly id: string;
  readonly userId: string;
  readonly question: string;
  readonly answer: string | null;
  readonly createdAt: Date;
}

// SecurityLog model
interface SecurityLog {
  readonly id: string;
  readonly userId: string;
  readonly eventType: 'time_manipulation' | 'timezone_change' | 'suspicious_activity' | 'validation_failure';
  readonly details: Record<string, unknown>;
  readonly serverTime: Date;
  readonly clientTime: Date;
  readonly timezoneOffset: number;
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

- `TIME_VALIDATION_FAILED` (400): Client time validation failed
- `SESSION_NOT_FOUND` (404): No active session found
- `INVALID_ACTION` (400): Action not allowed in current state
- `SETTINGS_VALIDATION_FAILED` (400): Settings validation failed
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_SERVER_ERROR` (500): Server error

### Error Response Example
```json
{
  "success": false,
  "error": "TIME_VALIDATION_FAILED",
  "message": "Time validation failed. Please ensure your device time is correct.",
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00Z",
  "path": "/api/actions/harm"
}
```

## 🔗 Related Documentation

- [Project Proposal](./QUIT_SMOKING_PROPOSAL.md)
- [UX Guidelines](./QUIT_SMOKING_UX.md)
- [Frontend Structure](./QUIT_SMOKING_FRONTEND.md)
- [Design System Prompt](./QUIT_SMOKING_DESIGN_SYSTEM.md)

---

**Security First**: All time-sensitive operations must be validated server-side. Never trust client-reported time.
