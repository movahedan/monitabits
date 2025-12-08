---
name: Passport Auth with Device Sessions
overview: Implement Passport-based authentication infrastructure with magic link authentication, JWT device tokens stored in database, and migration from deviceId-based system to userId + deviceSessionId. All sessions sync across devices for the same user.
todos:
  - id: install-dependencies
    content: "Install Passport dependencies: @nestjs/jwt, @nestjs/passport, passport, passport-jwt, @types/passport-jwt"
    status: pending
  - id: update-schema
    content: "Update Prisma schema: Add User, DeviceSession, MagicLinkToken models and update all foreign keys from deviceId to userId"
    status: pending
  - id: jwt-service
    content: Create JWT service for device token generation and verification
    status: pending
  - id: magic-link-service
    content: Create magic link service for email-based authentication
    status: pending
  - id: auth-service
    content: Create auth service with magic link authentication and device session management
    status: pending
  - id: jwt-strategy
    content: Create Passport JWT strategy following NestJS Passport pattern
    status: pending
  - id: auth-controller
    content: Create auth controller with magic link request/verify endpoints
    status: pending
  - id: auth-module
    content: Create auth module with JwtModule and PassportModule configuration
    status: pending
  - id: jwt-auth-guard
    content: Create JwtAuthGuard to replace DeviceAuthGuard using Passport
    status: pending
  - id: user-decorators
    content: Create @UserId() and @DeviceSessionId() decorators to extract from request.user
    status: pending
  - id: sessions-service-update
    content: Update SessionsService to use userId + deviceSessionId instead of deviceId
    status: pending
  - id: actions-service-update
    content: Update ActionsService to use userId + deviceSessionId instead of deviceId
    status: pending
  - id: settings-service-update
    content: Update SettingsService to use userId instead of deviceId
    status: pending
  - id: statistics-service-update
    content: Update StatisticsService to use userId instead of deviceId
    status: pending
  - id: controllers-update
    content: Update all controllers to use JwtAuthGuard and new decorators
    status: pending
  - id: swagger-update
    content: Update Swagger configuration to use Bearer token instead of API key
    status: pending
  - id: migration-script
    content: Create data migration script to convert Device records to User + DeviceSession
    status: pending
  - id: frontend-api-headers
    content: Update frontend API headers to use device token from cookie in Authorization header
    status: pending
  - id: frontend-auth-flow
    content: "Create frontend auth flow: magic link request page and verification page"
    status: pending
  - id: api-client-update
    content: Update API client (mutator.server.ts) to send device token in Authorization header
    status: pending
---

# Passport Authentication Infrastructure with Device Sessions

## Architecture Overview

**Current State:**

- `Device` model = user (one-to-one)
- All data tied to `deviceId` directly
- Simple UUID-based device identification via `X-Device-Id` header

**Target State:**

- `User` model (one user, multiple devices)
- `DeviceSession` model (one per device, stores JWT device token)
- All data linked to `userId` (sessions sync across devices)
- JWT device token stored in DB (`DeviceSession.deviceToken`)
- Magic link authentication for user registration/login
- Passport JWT strategy for device token validation

## Phase 1: Dependencies & Database Schema

### 1.1 Install Dependencies

**File:** `apps/monitabits-api/package.json`

Add dependencies:

- `@nestjs/jwt` - JWT module for NestJS
- `@nestjs/passport` - Passport integration for NestJS
- `passport` - Authentication middleware
- `passport-jwt` - JWT strategy for Passport
- `bcrypt` - Password hashing (if needed for future)
- `@types/passport-jwt` - TypeScript types

### 1.2 Update Prisma Schema

**File:** `apps/monitabits-api/prisma/schema.prisma`

Add new models:

```prisma
model User {
  id            String    @id @default(uuid())
  email         String?   @unique
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  deviceSessions DeviceSession[]
  sessions      Session[]
  actions       Action[]
  checkIns      CheckIn[]
  settings      Settings?
  followUps     FollowUp[]
  securityLogs  SecurityLog[]
  magicLinks    MagicLinkToken[]

  @@map("users")
}

model DeviceSession {
  id          String   @id @default(uuid())
  userId      String
  deviceToken String   @unique // JWT token stored in DB
  deviceName  String?  // Optional user-friendly name
  lastActive  DateTime @default(now())
  expiresAt   DateTime
  revoked     Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([deviceToken])
  @@map("device_sessions")
}

model MagicLinkToken {
  id        String   @id @default(uuid())
  userId    String?
  email     String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([token])
  @@index([email])
  @@map("magic_link_tokens")
}
```

Update all existing models to use `userId` instead of `deviceId`:

- `Session.userId` + `Session.deviceSessionId?` (optional for tracking)
- `Action.userId` + `Action.deviceSessionId?`
- `CheckIn.userId` + `CheckIn.deviceSessionId?`
- `Settings.userId` (unique, one per user)
- `FollowUp.userId` + `FollowUp.deviceSessionId?`
- `SecurityLog.userId` + `SecurityLog.deviceSessionId?`

Remove `Device` model after migration (or keep temporarily for backward compatibility).

## Phase 2: Authentication Module with Passport

### 2.1 Create Auth Module Structure

**Files to create:**

- `apps/monitabits-api/src/auth/auth.module.ts`
- `apps/monitabits-api/src/auth/auth.controller.ts`
- `apps/monitabits-api/src/auth/auth.service.ts`
- `apps/monitabits-api/src/auth/auth.model.ts`
- `apps/monitabits-api/src/auth/jwt.service.ts`
- `apps/monitabits-api/src/auth/magic-link.service.ts`
- `apps/monitabits-api/src/auth/strategies/jwt.strategy.ts`

### 2.2 JWT Service

**File:** `apps/monitabits-api/src/auth/jwt.service.ts`

Implement JWT token generation and verification:

```typescript
@Injectable()
export class JwtService {
  // Generate JWT device token
  generateDeviceToken(userId: string, deviceSessionId: string): string
  
  // Verify and decode JWT device token
  verifyDeviceToken(token: string): { userId: string; deviceSessionId: string }
}
```

JWT payload structure:

```typescript
{
  userId: string;
  deviceSessionId: string;
  type: 'device';
  iat: number;
  exp: number;
}
```

Configuration:

- Secret from `process.env.JWT_SECRET`
- Expiration: 30 days (configurable)
- Algorithm: HS256

### 2.3 Magic Link Service

**File:** `apps/monitabits-api/src/auth/magic-link.service.ts`

Implement magic link generation and verification:

```typescript
@Injectable()
export class MagicLinkService {
  // Generate magic link token
  generateMagicLink(email: string): Promise<{ token: string; expiresAt: Date }>
  
  // Verify and consume magic link token
  verifyMagicLink(token: string): Promise<{ userId: string; email: string }>
  
  // Send magic link email (placeholder - integrate with email service later)
  sendMagicLinkEmail(email: string, token: string): Promise<void>
}
```

Magic link token:

- Random UUID stored in `MagicLinkToken` table
- Expires in 15 minutes
- Single-use (marked as `used` after verification)
- Links to `User` if exists, or creates new user

### 2.4 Auth Service

**File:** `apps/monitabits-api/src/auth/auth.service.ts`

Implement authentication logic:

```typescript
@Injectable()
export class AuthService {
  // Request magic link
  requestMagicLink(email: string): Promise<void>
  
  // Verify magic link and create device session
  authenticateWithMagicLink(token: string, deviceName?: string): Promise<AuthResponse>
  
  // Get or create device session (for additional devices)
  getOrCreateDeviceSession(userId: string, deviceName?: string): Promise<DeviceSession>
  
  // Revoke device session
  revokeDeviceSession(deviceToken: string): Promise<void>
  
  // Refresh device token (optional, for token rotation)
  refreshDeviceToken(deviceToken: string): Promise<string>
}
```

`AuthResponse` structure:

```typescript
{
  user: { id: string; email: string | null };
  deviceToken: string; // JWT token
  expiresAt: Date;
}
```

### 2.5 Passport JWT Strategy

**File:** `apps/monitabits-api/src/auth/strategies/jwt.strategy.ts`

Implement Passport JWT strategy following NestJS Passport pattern:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    @Inject(JWT_MODULE_OPTIONS) private jwtOptions: JwtModuleOptions,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Also support X-Device-Token header
      ignoreExpiration: false,
      secretOrKey: jwtOptions.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    // Verify device session exists and is not revoked
    // Return user info for request
  }
}
```

Extract token from:

1. `Authorization: Bearer <token>` header (primary)
2. `X-Device-Token` header (fallback)
3. Cookie: `monitabits_device_token` (fallback)

### 2.6 Auth Controller

**File:** `apps/monitabits-api/src/auth/auth.controller.ts`

Endpoints:

- `POST /auth/magic-link` - Request magic link (email in body)
- `POST /auth/verify` - Verify magic link token, return device token
- `POST /auth/device` - Create new device session for existing user
- `DELETE /auth/device/:token` - Revoke device session
- `POST /auth/refresh` - Refresh device token (optional)

### 2.7 Auth Module Configuration

**File:** `apps/monitabits-api/src/auth/auth.module.ts`

Configure:

- `JwtModule.register()` with secret and options
- `PassportModule.register({ defaultStrategy: 'jwt' })`
- Import `PrismaModule` for database access
- Export `JwtService` for use in other modules

## Phase 3: Auth Guards and Decorators

### 3.1 Create JWT Auth Guard

**File:** `apps/monitabits-api/src/common/guards/jwt-auth.guard.ts` (new)

Replace `DeviceAuthGuard` with Passport-based JWT guard:

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Can override canActivate if needed
  // Passport handles JWT validation via JwtStrategy
}
```

### 3.2 Create User Decorators

**Files:**

- `apps/monitabits-api/src/common/decorators/user-id.decorator.ts` (new)
- `apps/monitabits-api/src/common/decorators/device-session-id.decorator.ts` (new)

Extract from request (set by Passport strategy):

```typescript
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.userId;
  },
);

export const DeviceSessionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.deviceSessionId;
  },
);
```

### 3.3 Update Time Validation Guard

**File:** `apps/monitabits-api/src/common/guards/time-validation.guard.ts`

Keep existing time validation logic. It runs after JWT auth guard.

## Phase 4: Service Layer Updates

### 4.1 Update Sessions Service

**File:** `apps/monitabits-api/src/sessions/sessions.service.ts`

Change all methods from `deviceId: string` to `userId: string, deviceSessionId?: string`:

- `getCurrentSession(userId: string, deviceSessionId?: string)`
- `checkIn(userId: string, deviceSessionId: string, clientTime: Date)`
- `checkOut(userId: string, deviceSessionId: string, clientTime: Date)`
- `getUserStats(userId: string)` - Update implementation

Update all Prisma queries:

- Replace `where: { deviceId }` with `where: { userId }`
- Add optional `deviceSessionId` tracking where relevant

### 4.2 Update Actions Service

**File:** `apps/monitabits-api/src/actions/actions.service.ts`

Change all methods:

- `logCheat(userId: string, deviceSessionId: string, clientTime: Date)`
- `logHarm(userId: string, deviceSessionId: string, clientTime: Date)`
- `getPendingFollowUp(userId: string)`
- `submitFollowUp(userId: string, deviceSessionId: string, clientTime: Date, followUpDto: FollowUpRequest)`

### 4.3 Update Settings Service

**File:** `apps/monitabits-api/src/settings/settings.service.ts`

Change:

- `getSettings(userId: string)`
- `updateSettings(userId: string, lockdownMinutes: number)`

### 4.4 Update Statistics Service

**File:** `apps/monitabits-api/src/statistics/statistics.service.ts`

Change:

- `getLockdownNow(userId: string)`
- `getSummary(userId: string)`
- `getDetails(userId: string, startDate: Date, endDate: Date)`

## Phase 5: Controller Updates

### 5.1 Update All Controllers

**Files:**

- `apps/monitabits-api/src/sessions/sessions.controller.ts`
- `apps/monitabits-api/src/actions/actions.controller.ts`
- `apps/monitabits-api/src/settings/settings.controller.ts`
- `apps/monitabits-api/src/statistics/statistics.controller.ts`

Replace:

- `@UseGuards(DeviceAuthGuard, TimeValidationGuard)` → `@UseGuards(JwtAuthGuard, TimeValidationGuard)`
- `@DeviceId() deviceId: string` → `@UserId() userId: string, @DeviceSessionId() deviceSessionId: string`
- Update all service method calls to pass `userId` and `deviceSessionId`

### 5.2 Update App Module

**File:** `apps/monitabits-api/src/app.module.ts`

- Import `AuthModule`
- Remove `DeviceAuthGuard` from global providers (if it was global)

### 5.3 Update Swagger Configuration

**File:** `apps/monitabits-api/src/swagger.setup.ts`

Replace API key security with Bearer token:

```typescript
.addBearerAuth(
  {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT device token',
  },
  'JWT',
)
```

## Phase 6: Data Migration

### 6.1 Create Migration Script

**File:** `apps/monitabits-api/prisma/migrations/migrate-device-to-user.ts`

Script to:

1. For each `Device` record:

   - Create `User` record (use deviceId as temporary email: `device-${deviceId}@temp.local` or generate anonymous)
   - Generate JWT device token using `JwtService`
   - Create `DeviceSession` record with JWT token
   - Update all related records (Session, Action, CheckIn, etc.) to use `userId` + `deviceSessionId`

2. Map old `deviceId` to new `userId` + `deviceSessionId`
3. Generate new JWT tokens for all device sessions

### 6.2 Migration Strategy

1. Run Prisma migration to add new tables (non-breaking, adds columns)
2. Run data migration script to populate User + DeviceSession
3. Deploy code changes
4. Old `deviceId` requests will fail, but new auth flow works
5. Optionally: Add backward compatibility layer temporarily (accept both old and new auth)

## Phase 7: Frontend Updates

### 7.1 Update API Headers

**File:** `apps/monitabits-app/src/utils/api-headers.ts`

Change from `X-Device-Id` to:

- Read device token from cookie: `monitabits_device_token`
- Send in `Authorization: Bearer <token>` header (primary)
- Fallback to `X-Device-Token` header if needed

### 7.2 Update Middleware

**File:** `apps/monitabits-app/src/middleware.ts`

Remove device ID cookie generation. Device token comes from auth flow.

### 7.3 Create Auth Flow

**Files:**

- `apps/monitabits-app/src/app/auth/page.tsx` - Magic link request page
- `apps/monitabits-app/src/app/auth/verify/page.tsx` - Magic link verification page
- `apps/monitabits-app/src/lib/auth/auth-client.ts` - Auth client functions

Implement:

- Magic link request form (email input)
- Magic link verification (extract token from URL query param)
- Store device token in cookie after successful auth
- Redirect to dashboard after auth

### 7.4 Update API Client

**File:** `packages/monitabits-kubb/src/mutator.server.ts`

Update `customFetch` to:

- Read device token from cookie: `monitabits_device_token`
- Send in `Authorization: Bearer <token>` header
- Remove `X-Device-Id` header logic

### 7.5 Update CORS Configuration

**File:** `apps/monitabits-api/src/index.ts`

Update CORS to:

- Remove `X-Device-Id` from allowed headers
- Add `Authorization` to allowed headers
- Keep cookie support (`credentials: true`)

## Phase 8: Environment Variables

### 8.1 Add Environment Variables

**File:** `.env` or environment configuration

Add:

- `JWT_SECRET` - Secret for JWT token signing (use strong random string)
- `JWT_EXPIRES_IN` - Token expiration (default: "30d")
- `MAGIC_LINK_EXPIRES_IN` - Magic link expiration (default: "15m")
- `MAGIC_LINK_BASE_URL` - Base URL for magic link emails (e.g., "http://localhost:3002/auth/verify")

## Implementation Order

1. **Dependencies** (Phase 1.1) - Install Passport packages
2. **Database Schema** (Phase 1.2) - Add User, DeviceSession, MagicLinkToken models
3. **JWT Service** (Phase 2.2) - Core token logic
4. **Magic Link Service** (Phase 2.3) - Magic link generation/verification
5. **Auth Service** (Phase 2.4) - Authentication orchestration
6. **Passport JWT Strategy** (Phase 2.5) - Token validation
7. **Auth Controller** (Phase 2.6) - Auth endpoints
8. **Auth Guards** (Phase 3) - Request authentication
9. **Service Updates** (Phase 4) - Business logic migration
10. **Controller Updates** (Phase 5) - API endpoint migration
11. **Data Migration** (Phase 6) - Existing data migration
12. **Frontend Updates** (Phase 7) - Client-side changes

## Key Files to Modify

**New Files:**

- `apps/monitabits-api/src/auth/**/*.ts` (entire auth module)
- `apps/monitabits-api/src/auth/strategies/jwt.strategy.ts`
- `apps/monitabits-api/src/common/guards/jwt-auth.guard.ts`
- `apps/monitabits-api/src/common/decorators/user-id.decorator.ts`
- `apps/monitabits-api/src/common/decorators/device-session-id.decorator.ts`
- `apps/monitabits-api/prisma/migrations/migrate-device-to-user.ts`

**Modified Files:**

- `apps/monitabits-api/prisma/schema.prisma`
- `apps/monitabits-api/package.json` (dependencies)
- All service files (`sessions.service.ts`, `actions.service.ts`, etc.)
- All controller files
- `apps/monitabits-api/src/app.module.ts`
- `apps/monitabits-api/src/swagger.setup.ts`
- `apps/monitabits-api/src/index.ts` (CORS)
- `apps/monitabits-app/src/utils/api-headers.ts`
- `apps/monitabits-app/src/middleware.ts`
- `packages/monitabits-kubb/src/mutator.server.ts`

## Notes

- Device token is JWT stored in DB (`DeviceSession.deviceToken`)
- Device token sent via `Authorization: Bearer <token>` header or cookie
- All data linked to `userId` (sessions sync across devices)
- `DeviceSession` tracks which device made the request (optional in most queries)
- Magic link authentication for user registration/login
- Passport JWT strategy validates tokens and loads device session from DB
- Migration script converts existing Device records to User + DeviceSession