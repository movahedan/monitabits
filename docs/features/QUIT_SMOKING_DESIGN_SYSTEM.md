# 🏗️ Cigarette Quitting Application - System Design

> Technical architecture, system components, and infrastructure design for the quit smoking accountability application.

## 📋 Table of Contents

- [System Architecture Overview](#-system-architecture-overview)
- [Technology Stack](#-technology-stack)
- [System Components](#-system-components)
- [Data Flow](#-data-flow)
- [Security Architecture](#-security-architecture)
- [Deployment Architecture](#-deployment-architecture)
- [Infrastructure](#-infrastructure)
- [Integration Points](#-integration-points)
- [Scalability Considerations](#-scalability-considerations)

## 🏗️ System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (Port 3002)                       │   │
│  │  - React 19 + App Router                           │   │
│  │  - Tailwind CSS + shadcn/ui                         │   │
│  │  - PWA Capabilities                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS/REST API
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                      API Layer                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  NestJS Backend (Port 3003)                          │   │
│  │  - RESTful API                                       │   │
│  │  - Time Validation Service                           │   │
│  │  - Security Middleware                               │   │
│  └───────────────────────┬──────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    Data Layer                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                                  │   │
│  │  - Timer State                                        │   │
│  │  - Pomodoro Sessions                                  │   │
│  │  - Settings                                           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Server-Side Authority**: All time-sensitive operations validated server-side
2. **Stateless API**: RESTful API with device-based identification
3. **Single-User Design**: Device-based authentication, no multi-user complexity
4. **Security-First**: Anti-cheat mechanisms at every layer
5. **Progressive Enhancement**: PWA capabilities for offline support

## 🛠️ Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.4.7 | React framework with App Router |
| **React** | 19.1.1 | UI library |
| **TypeScript** | 5.9.3 | Type safety |
| **Tailwind CSS** | Latest | Utility-first CSS framework |
| **shadcn/ui** | Latest | Component library |
| **Bun** | 1.3.1 | Runtime and package manager |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | Latest | Node.js framework |
| **TypeScript** | 5.9.3 | Type safety |
| **PostgreSQL** | 15+ | Relational database |
| **TypeORM/Prisma** | Latest | ORM (recommended: Prisma) |
| **Bun** | 1.3.1 | Runtime and package manager |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local development |
| **Nginx** | Reverse proxy (production) |
| **GitHub Actions** | CI/CD |

## 🧩 System Components

### Frontend Components

#### 1. Next.js Application (`monitabits-app`)
- **Location**: `apps/monitabits-app/`
- **Port**: 3002
- **Responsibilities**:
  - User interface rendering
  - Client-side state management
  - API communication
  - Device ID management
  - Time synchronization
  - Auto-save functionality
  - PWA service worker

#### 2. Shared UI Package (`@repo/ui`)
- **Location**: `packages/ui/`
- **Port**: 3004 (Storybook)
- **Responsibilities**:
  - Reusable React components
  - Component documentation (Storybook)
  - Design system implementation

### Backend Components

#### 1. NestJS API Server (`monitabits-api`)
- **Location**: `apps/monitabits-api/`
- **Port**: 3003
- **Responsibilities**:
  - RESTful API endpoints
  - Business logic
  - Time validation
  - Security enforcement
  - Database operations
  - Timer management

#### 2. Database (PostgreSQL)
- **Purpose**: Persistent data storage
- **Schema**: See [Database & API Design](./QUIT_SMOKING_DATABASE_API.md)
- **Tables**:
  - `users` - Device-based user records
  - `timer` - Current Pomodoro timer state
  - `check_ins` - Activity logging
  - `settings` - User preferences
  - `reflections` - Reflection responses
  - `security_logs` - Security events

### Shared Packages

#### 1. Utils Package (`@repo/utils`)
- **Location**: `packages/utils/`
- **Responsibilities**:
  - Shared utilities (cn, logger)
  - Common helper functions

#### 2. TypeScript Config (`@repo/typescript-config`)
- **Location**: `packages/typescript-config/`
- **Responsibilities**:
  - Shared TypeScript configurations
  - Type definitions

## 🔄 Data Flow

### Request Flow

```
User Action (Frontend)
    ↓
Client Component (React)
    ↓
API Client (Server Actions / SWR Hooks)
    ├─ Device ID (cookies)
    ↓
HTTP Request (fetch)
    ├─ Headers: X-Device-Id
    └─ Body: Request payload
    ↓
NestJS Guards
    ├─ Device Authentication
    └─ Request Logging
    ↓
Controller (Route Handler)
    ↓
Service (Business Logic)
    ├─ Timer Service
    └─ Settings Service
    ↓
Repository/ORM (Database Access)
    ↓
PostgreSQL Database
    ↓
Response (JSON)
    ├─ Success: { success: true, data: {...} }
    └─ Error: { success: false, error: {...} }
    ↓
Frontend (Update UI)
```

### Timer State Management Flow

```
Timer Operation Request
    ↓
Device Authentication
    ├─ Validate X-Device-Id
    └─ Ensure Device Exists
    ↓
Timer Service
    ├─ Get Current Timer State
    ├─ Validate Operation (e.g., can't pause if not running)
    ├─ Update Timer State
    ├─ Calculate Remaining Time (if running)
    └─ Record Session (if completed)
    ↓
Response
    ├─ Success: Return Updated Timer
    └─ Error: Return Error Message
```

### Timer Management Flow

```
App Open
    ↓
GET /api/timer/current
    ├─ Device ID
    ↓
Backend: Get or Create Device
    ↓
Backend: Get Current Timer
    ├─ Check Timer State (idle/running/paused/completed)
    ├─ Calculate Remaining Time (if running)
    └─ Return Timer Data
    ↓
Response: Timer Data
    ↓
Frontend: Update UI
    ├─ Show Timer Display
    ├─ Show Countdown (if running)
    └─ Show Controls (based on state)
```

## 🔒 Security Architecture

### Security Layers

#### 1. Client-Side Security
- **Device ID**: Generated and stored in cookies (via middleware)
- **HTTPS Only**: All API calls over HTTPS
- **Input Validation**: Client-side validation before submission

#### 2. Network Security
- **HTTPS/TLS**: Encrypted communication
- **CORS**: Configured for allowed origins
- **Rate Limiting**: Prevent abuse on critical endpoints
- **Request Validation**: All requests validated

#### 3. Server-Side Security
- **Device Authentication**: Device ID verified on all requests
- **Timer State Management**: Server-side timer state prevents manipulation
- **Input Sanitization**: All inputs sanitized
- **SQL Injection Prevention**: Parameterized queries (Prisma)
- **State Validation**: Timer operations validated (e.g., can't pause if not running)

### Timer State Management

```
┌─────────────────────────────────────────┐
│      Timer State Pipeline                │
├─────────────────────────────────────────┤
│ 1. Get Current Timer from Database      │
│ 2. Calculate Remaining Time (if running)│
│ 3. Check if Timer Completed             │
│ 4. Update State Based on Operation      │
│ 5. Store Remaining Time (if paused)      │
│ 6. Record Session (if completed)       │
│ 7. Return Updated Timer State           │
└─────────────────────────────────────────┘
```

### Timer State Transitions

- `idle` → `running` - Start timer operation
- `running` → `paused` - Pause timer operation
- `paused` → `running` - Resume timer operation
- `running` → `completed` - Timer expires automatically
- `*` → `idle` - Reset timer operation

## 🚀 Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────┐
│     Docker Compose (dev)                 │
├─────────────────────────────────────────┤
│  - monitabits-app (Next.js)             │
│    Port: 3002                            │
│  - monitabits-api (NestJS)              │
│    Port: 3003                            │
│  - postgres (PostgreSQL)                │
│    Port: 5432                            │
│  - ui-storybook (Storybook)             │
│    Port: 3004                            │
└─────────────────────────────────────────┘
```

### Production Environment

```
┌─────────────────────────────────────────┐
│         Nginx (Reverse Proxy)            │
│         Port: 80/443                     │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │  Next.js App (Container)          │  │
│  │  Port: 3002 (internal)            │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  NestJS API (Container)           │  │
│  │  Port: 3003 (internal)            │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  PostgreSQL (Container)           │  │
│  │  Port: 5432 (internal)             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Deployment Flow

```
Code Push (Git)
    ↓
GitHub Actions (CI/CD)
    ├─ Run Tests
    ├─ Build Applications
    ├─ Build Docker Images
    └─ Push to Registry
    ↓
Deploy to Production
    ├─ Pull Latest Images
    ├─ Run Database Migrations
    ├─ Restart Containers
    └─ Health Checks
```

## 🏢 Infrastructure

### Container Architecture

#### Frontend Container
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bun run build
CMD ["bun", "run", "start"]
```

#### Backend Container
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bun run build
CMD ["bun", "run", "start"]
```

#### Database Container
```yaml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: monitabits
    POSTGRES_USER: monitabits
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

### Environment Variables

#### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:3003
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

#### Backend
```env
PORT=3003
DATABASE_URL=postgresql://user:pass@postgres:5432/monitabits
NODE_ENV=production
HOST=0.0.0.0
```

## 🔌 Integration Points

### Frontend ↔ Backend

**Communication Protocol**: RESTful HTTP/HTTPS

**Request Format**:
```typescript
Headers:
  X-Device-Id: string
  X-Client-Time: ISO-8601 timestamp
  X-Timezone-Offset: number (minutes)
  X-Timezone-Name: string
  Content-Type: application/json
```

**Response Format**:
```typescript
Success:
  { success: true, data: T }

Error:
  { success: false, error: string, message: string, statusCode: number }
```

### Backend ↔ Database

**ORM**: Prisma (recommended) or TypeORM

**Connection**: PostgreSQL connection pool

**Migrations**: Version-controlled database migrations

### External Services

**NTP Servers**: For accurate server time synchronization (optional, can use system time)

## 📈 Scalability Considerations

### Current Design (Single User)

- **Stateless API**: Easy to scale horizontally
- **Device-Based Auth**: Device ID stored in cookies, no session storage needed
- **Database**: Single user, minimal load

### Future Scalability (If Multi-User)

1. **Load Balancing**: Multiple API instances behind load balancer
2. **Database Scaling**: Read replicas for read-heavy operations
3. **Caching**: Redis for frequently accessed data
4. **CDN**: Static assets served via CDN
5. **Database Sharding**: If user base grows significantly

### Performance Optimizations

- **Database Indexing**: Indexed on frequently queried columns
- **API Response Caching**: Cache timer data (with TTL)
- **Frontend Caching**: Service worker for offline support
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component

## 🔗 Related Documentation

- [Project Proposal](./QUIT_SMOKING_PROPOSAL.md)
- [UX Guidelines](./QUIT_SMOKING_UX.md)
- [Database & API Design](./QUIT_SMOKING_DATABASE_API.md)
- [Frontend Structure](./QUIT_SMOKING_FRONTEND.md)

---

**System Design Principle**: Security-first architecture with server-side time authority. Simple, scalable, and maintainable.
