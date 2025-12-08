---
name: Multi-User Backend Features
overview: Transform the single-user device-based habit tracking app into a multi-user platform with gamification, search, notifications, and group features. This is structured as a learning project to gain backend experience with complex infrastructure patterns.
todos:
  - id: phase1-db-migration
    content: Create database migration to add User model and migrate Device relationships. Keep backward compatibility with deviceId.
    status: pending
  - id: phase1-auth-module
    content: Build authentication module with JWT, registration, login, and refresh token endpoints.
    status: pending
  - id: phase1-users-module
    content: Create users module for profile management (GET /users/me, PUT /users/me, GET /users/:id).
    status: pending
  - id: phase1-migrate-services
    content: Update all existing services (sessions, actions, settings, statistics) to support userId alongside deviceId during migration period.
    status: pending
  - id: phase1-jwt-guards
    content: Create JWT authentication guards and @User() decorator. Update all controllers to use JWT guards.
    status: pending
  - id: phase2-gamification-schema
    content: Add Achievement, UserAchievement models to Prisma schema. Add points/level fields to User model.
    status: pending
  - id: phase2-achievements-module
    content: Build achievements module with unlock logic, progress tracking, and seed initial achievements.
    status: pending
  - id: phase2-points-system
    content: Implement points system - award points on session completion, deduct on relapse, calculate levels.
    status: pending
  - id: phase2-leaderboards-module
    content: Create leaderboards module with global, streak, and time-saved leaderboards. Add pagination and caching.
    status: pending
  - id: phase2-event-system
    content: Set up event-driven architecture (EventEmitter) for achievements and points. Integrate with existing services.
    status: pending
  - id: phase3-search-module
    content: Build user search module using PostgreSQL full-text search with pagination and privacy filtering.
    status: pending
  - id: phase3-follow-system
    content: Create follow system module - follow/unfollow users, get followers/following lists with pagination.
    status: pending
  - id: phase3-profile-enhancement
    content: Enhance user profiles with follower counts, public stats display, and privacy controls.
    status: pending
  - id: phase4-notifications-schema
    content: Add Notification, PushSubscription, NotificationPreferences models to Prisma schema.
    status: pending
  - id: phase4-notifications-module
    content: Build notifications module - create notifications, mark as read, get unread count.
    status: pending
  - id: phase4-push-service
    content: Implement push notification service with web-push library, VAPID keys, and subscription management.
    status: pending
  - id: phase4-queue-system
    content: Set up Bull queue system for async notification sending with retry logic and batching.
    status: pending
  - id: phase4-event-integration
    content: Integrate notifications with gamification events (achievement unlocked, streak milestone, etc.).
    status: pending
  - id: phase5-groups-schema
    content: Add Group, GroupMember, GroupChallenge, GroupAnnouncement models to Prisma schema.
    status: pending
  - id: phase5-groups-module
    content: Build groups module - create/join/leave groups, member roles, visibility controls.
    status: pending
  - id: phase5-challenges-module
    content: Create group challenges module - create challenges, track progress, calculate group statistics.
    status: pending
  - id: phase5-group-lockdowns
    content: Implement synchronized group lockdown periods and group-wide session tracking.
    status: pending
  - id: phase5-announcements-module
    content: Build group announcements module - create announcements, send push notifications to all members.
    status: pending
  - id: phase5-websockets
    content: "Optional: Add WebSocket gateway for real-time group updates and live notifications."
    status: pending
---

# Multi-User Backend Features - Implementation Plan

This plan transforms the current device-based single-user system into a multi-user platform with gamification, search, notifications, and group features. All features are built as NestJS modules in a modular monolith architecture.

## Current State

- Single-user device-based authentication via `X-Device-Id` header
- All tables use `deviceId` foreign keys
- Device-based guards and decorators
- 4 core modules: sessions, actions, settings, statistics

## Phase 1: Multi-User Foundation (Week 1-2)

### 1.1 Database Schema Migration

**File: `apps/monitabits-api/prisma/schema.prisma`**

Add new models:

- `User` model (email, username, displayName, avatar, passwordHash, deviceId for backward compatibility, profileVisibility)
- Migrate existing relations from `Device` to `User`
- Keep `Device` model temporarily for backward compatibility
- Add indexes for username, email, profileVisibility

**Migration Strategy:**

- Add `User` model with `deviceId` as optional unique field
- Create migration that links existing devices to users (deviceId → userId mapping)
- Add `userId` columns to all tables alongside existing `deviceId` columns
- Run data migration to populate `userId` from `deviceId`
- Remove `deviceId` columns in subsequent migration (or keep for backward compatibility)

### 1.2 Authentication Module

**New Module: `apps/monitabits-api/src/auth/`**

Create:

- `auth.module.ts` - Import JwtModule, PassportModule
- `auth.controller.ts` - POST /auth/register, POST /auth/login, POST /auth/refresh
- `auth.service.ts` - Registration, login, JWT generation, password hashing (bcrypt)
- `guards/jwt-auth.guard.ts` - Replace DeviceAuthGuard for protected routes
- `guards/roles.guard.ts` - Role-based access control
- `strategies/jwt.strategy.ts` - Passport JWT strategy
- `models/auth.model.ts` - RegisterDto, LoginDto, AuthResponseDto with @ApiProperty decorators

**Dependencies:**

- `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`

**Key Implementation:**

- Password hashing with bcrypt (10 rounds)
- JWT tokens (access token 15min, refresh token 7 days)
- Refresh token stored in database (User model)
- Return deviceId in response for backward compatibility during migration

### 1.3 Users Module

**New Module: `apps/monitabits-api/src/users/`**

Create:

- `users.module.ts`
- `users.controller.ts` - GET /users/me, GET /users/:id, PUT /users/me
- `users.service.ts` - User CRUD operations, profile management
- `user.model.ts` - UserDto, UpdateUserDto, UserProfileDto

**Key Features:**

- Get current user profile
- Update profile (username, displayName, avatar, profileVisibility)
- Get public user profiles by ID
- Username validation (unique, format validation)

### 1.4 Migration Guards & Decorators

**Update: `apps/monitabits-api/src/common/guards/`**

Create hybrid approach:

- `jwt-auth.guard.ts` - JWT token validation
- Keep `device-auth.guard.ts` for backward compatibility
- Create `hybrid-auth.guard.ts` - Accepts either JWT or deviceId header

**Update all controllers:**

- Replace `DeviceAuthGuard` with `JwtAuthGuard` (or hybrid for migration period)
- Add `@User()` decorator to extract user from JWT token (similar to `@DeviceId()`)
- Update services to use `userId` instead of `deviceId`

**Files to update:**

- `sessions/sessions.controller.ts`
- `sessions/sessions.service.ts`
- `actions/actions.controller.ts`
- `actions/actions.service.ts`
- `settings/settings.controller.ts`
- `settings/settings.service.ts`
- `statistics/statistics.controller.ts`
- `statistics/statistics.service.ts`

### 1.5 App Module Updates

**File: `apps/monitabits-api/src/app.module.ts`**

Add new modules:

- AuthModule
- UsersModule

Configure JWT module with secret and expiration.

## Phase 2: Gamification System (Week 2-3)

### 2.1 Database Schema - Gamification

**File: `apps/monitabits-api/prisma/schema.prisma`**

Add models:

- `Achievement` (id, name, description, icon, points, createdAt)
- `UserAchievement` (id, userId, achievementId, unlockedAt, progress)
- `User` model: Add fields - totalPoints, level, currentStreak (or calculate)

### 2.2 Achievements Module

**New Module: `apps/monitabits-api/src/gamification/achievements/`**

Create:

- `achievements.module.ts`
- `achievements.controller.ts` - GET /achievements, GET /achievements/me
- `achievements.service.ts` - Achievement CRUD, unlock logic, progress tracking
- `achievement.model.ts` - AchievementDto, UserAchievementDto

**Key Features:**

- Seed initial achievements (First Session, 7-Day Streak, 30-Day Streak, etc.)
- Unlock achievements based on events (session completed, streak milestone)
- Calculate achievement progress
- Get user's achievements with unlocked status

### 2.3 Points System

**Update: `apps/monitabits-api/src/gamification/points/`**

Create:

- `points.service.ts` - Award points, calculate level from total points
- Integrate with SessionsService - award points on session completion
- Integrate with ActionsService - deduct points on relapse

**Point Rules:**

- +10 points per completed session
- +50 points per 7-day streak milestone
- +200 points per 30-day streak milestone
- -20 points per relapse

**Level System:**

- Level = floor(totalPoints / 100) + 1
- Store level in User model or calculate on-the-fly

### 2.4 Leaderboards Module

**New Module: `apps/monitabits-api/src/gamification/leaderboards/`**

Create:

- `leaderboards.module.ts`
- `leaderboards.controller.ts` - GET /leaderboards/points, GET /leaderboards/streaks, GET /leaderboards/time-saved
- `leaderboards.service.ts` - Ranking algorithms, pagination, caching

**Leaderboard Types:**

- Global points leaderboard (top users by totalPoints)
- Streak leaderboard (top users by currentStreak)
- Time saved leaderboard (top users by totalTimeSaved)
- Weekly/monthly leaderboards

**Implementation:**

- Use Prisma aggregations with `orderBy` and `take` for pagination
- Add indexes on `totalPoints`, `currentStreak`, `totalTimeSaved`
- Cache leaderboards in Redis (optional) or in-memory with TTL

### 2.5 Event-Driven Integration

**Update existing services to emit events:**

Use NestJS EventEmitter or custom event bus:

- `SessionsService` - Emit 'session.completed' event
- `ActionsService` - Emit 'relapse.recorded' event
- `AchievementsService` - Listen to events and unlock achievements
- `PointsService` - Listen to events and award/deduct points

**File: `apps/monitabits-api/src/common/events/`**

Create:

- `events.module.ts` - EventEmitterModule
- `session.events.ts` - Event classes (SessionCompletedEvent, RelapseRecordedEvent)

## Phase 3: Search & Discovery (Week 3-4)

### 3.1 Database Schema - Social

**File: `apps/monitabits-api/prisma/schema.prisma`**

Add models:

- `Follow` (id, followerId, followingId, createdAt)
- Add indexes for efficient querying

### 3.2 User Search Module

**New Module: `apps/monitabits-api/src/search/`**

Create:

- `search.module.ts`
- `search.controller.ts` - GET /search/users?q=username&limit=20&offset=0
- `search.service.ts` - Full-text search implementation

**Implementation Options:**

1. PostgreSQL full-text search (simplest, no extra dependencies)

   - Use `pg_trgm` extension for fuzzy matching
   - Query: `SELECT * FROM users WHERE username ILIKE '%query%' OR displayName ILIKE '%query%'`

2. Elasticsearch (more powerful, separate service)
3. Meilisearch (lightweight alternative)

**Start with PostgreSQL full-text search:**

- Add GIN index on username and displayName
- Implement pagination (limit/offset or cursor-based)
- Filter by profileVisibility (only show public profiles)
- Return user profiles with basic stats

### 3.3 Follow System

**New Module: `apps/monitabits-api/src/social/follows/`**

Create:

- `follows.module.ts`
- `follows.controller.ts` - POST /follows/:userId, DELETE /follows/:userId, GET /follows/followers, GET /follows/following
- `follows.service.ts` - Follow/unfollow logic, get followers/following lists

**Key Features:**

- Follow/unfollow users
- Get followers list (paginated)
- Get following list (paginated)
- Prevent self-follow
- Check if following relationship exists

### 3.4 Profile Enhancement

**Update: `apps/monitabits-api/src/users/users.service.ts`**

Add:

- Get user profile with follower/following counts
- Get user profile with public stats (streak, achievements, points)
- Privacy controls (profileVisibility affects what data is visible)

## Phase 4: Push Notifications (Week 4-5)

### 4.1 Database Schema - Notifications

**File: `apps/monitabits-api/prisma/schema.prisma`**

Add models:

- `Notification` (id, userId, type, title, body, data, read, createdAt)
- `PushSubscription` (id, userId, endpoint, keys, userAgent, createdAt)
- `NotificationPreferences` (id, userId, preferences Json)

### 4.2 Notifications Module

**New Module: `apps/monitabits-api/src/notifications/`**

Create:

- `notifications.module.ts`
- `notifications.controller.ts` - GET /notifications, PUT /notifications/:id/read, POST /notifications/subscribe
- `notifications.service.ts` - Create notifications, mark as read, get unread count

**Notification Types:**

- `streak_milestone` - When user reaches streak milestone
- `achievement_unlocked` - When achievement is unlocked
- `friend_achievement` - When followed user unlocks achievement
- `group_announcement` - Group announcements
- `group_challenge_started` - New group challenge
- `leaderboard_position` - Leaderboard rank change

### 4.3 Push Service

**New Service: `apps/monitabits-api/src/notifications/push.service.ts`**

Create:

- Web Push subscription management
- Send push notifications using web-push library
- Handle VAPID keys (generate and store in env)

**Dependencies:**

- `web-push` package

**Implementation:**

- Store VAPID keys in environment variables
- Generate VAPID keys script
- Send push notifications to all user's subscriptions
- Handle push notification failures

### 4.4 Queue System (Bull/BullMQ)

**New Module: `apps/monitabits-api/src/notifications/queues/`**

Create:

- Notification queue processor
- Async notification sending
- Retry logic for failed notifications
- Batch notifications (combine multiple notifications)

**Dependencies:**

- `@nestjs/bull`, `bull`, `redis` (optional, can use in-memory for dev)

**Implementation:**

- Create notification jobs when events occur
- Process jobs in background
- Retry failed notifications (3 attempts)
- Batch similar notifications to reduce spam

### 4.5 Event Integration

**Update event listeners:**

- Listen to `achievement.unlocked` event → send notification
- Listen to `streak.milestone` event → send notification
- Listen to `group.announcement` event → send notifications to all group members

## Phase 5: Group Features (Week 5-6)

### 5.1 Database Schema - Groups

**File: `apps/monitabits-api/prisma/schema.prisma`**

Add models:

- `Group` (id, name, description, createdBy, visibility, maxMembers, createdAt)
- `GroupMember` (id, groupId, userId, role, joinedAt)
- `GroupChallenge` (id, groupId, name, description, startDate, endDate, goal, status)
- `GroupAnnouncement` (id, groupId, authorId, title, message, createdAt)

### 5.2 Groups Module

**New Module: `apps/monitabits-api/src/groups/`**

Create:

- `groups.module.ts`
- `groups.controller.ts` - CRUD operations for groups
  - POST /groups (create)
  - GET /groups (list, with filters)
  - GET /groups/:id (get group details)
  - PUT /groups/:id (update, owner/admin only)
  - DELETE /groups/:id (delete, owner only)
  - POST /groups/:id/join
  - DELETE /groups/:id/leave
  - GET /groups/:id/members
- `groups.service.ts` - Group management logic
- `group.model.ts` - GroupDto, CreateGroupDto, UpdateGroupDto

**Key Features:**

- Create groups (public, private, invite-only)
- Join/leave groups
- Member roles (owner, admin, member)
- Group visibility controls
- Member limit enforcement

### 5.3 Group Challenges Module

**New Module: `apps/monitabits-api/src/groups/challenges/`**

Create:

- `challenges.module.ts`
- `challenges.controller.ts` - CRUD for group challenges
- `challenges.service.ts` - Challenge logic, progress tracking

**Key Features:**

- Create group challenges (e.g., "30-day group streak challenge")
- Track challenge progress for all members
- Calculate group statistics (total days saved, group streak)
- Challenge completion logic

### 5.4 Group Lockdowns

**Update: `apps/monitabits-api/src/groups/lockdowns/`**

Create:

- Synchronized group lockdown periods
- When challenge starts, all members start lockdown
- Group-wide statistics (how many members completed, average time saved)

**Integration with Sessions:**

- Extend SessionsService to support group session tracking
- Track group participation in sessions

### 5.5 Group Announcements

**New Module: `apps/monitabits-api/src/groups/announcements/`**

Create:

- `announcements.controller.ts` - POST /groups/:id/announcements, GET /groups/:id/announcements
- `announcements.service.ts` - Create announcements, send push notifications

**Key Features:**

- Group owners/admins can create announcements
- Announcements trigger push notifications to all members
- Announcement history per group

### 5.6 Real-Time Updates (Optional - WebSockets)

**New Module: `apps/monitabits-api/src/groups/gateway/`**

Create:

- WebSocket gateway for real-time group updates
- Live leaderboard updates
- Instant notifications
- Member join/leave events

**Dependencies:**

- `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`

**Implementation:**

- Group room management
- Emit events to group members
- Handle connection/disconnection

## Migration Strategy

### Backward Compatibility Period

1. **Dual Support (Week 1-2):**

   - Keep `DeviceAuthGuard` working
   - Support both JWT and deviceId authentication
   - Services accept both `userId` and `deviceId`
   - Create users automatically from deviceId on first JWT login

2. **Gradual Migration:**

   - Frontend migrates to JWT authentication
   - Backend keeps deviceId support for existing sessions
   - Data migration runs in background

3. **Full Migration (Week 3):**

   - Remove deviceId support
   - All routes require JWT
   - Clean up Device model (optional, keep for audit)

## Testing Strategy

Each phase includes:

- Unit tests for services
- Integration tests for controllers
- Test database migrations
- E2E tests for critical flows

## Documentation Updates

Update:

- `apps/monitabits-api/CLAUDE.md` - Document new modules
- OpenAPI/Swagger - Auto-generated from DTOs
- API client generation (Kubb) will update automatically

## Key Files to Create/Modify

### New Modules:

- `src/auth/` - Authentication module
- `src/users/` - User management
- `src/gamification/achievements/` - Achievement system
- `src/gamification/leaderboards/` - Leaderboard system
- `src/search/` - User search
- `src/social/follows/` - Follow system
- `src/notifications/` - Notification system
- `src/groups/` - Group features
- `src/groups/challenges/` - Group challenges
- `src/groups/announcements/` - Group announcements

### Files to Update:

- `prisma/schema.prisma` - Add all new models
- `src/app.module.ts` - Import all new modules
- All existing services - Migrate from deviceId to userId
- All existing controllers - Update guards and decorators
- `src/common/guards/` - Add JWT guards
- `src/common/decorators/` - Add @User() decorator

## Dependencies to Add

```bash
# Phase 1
bun add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
bun add -D @types/passport-jwt @types/bcrypt

# Phase 4
bun add web-push @nestjs/bull bull
bun add -D @types/web-push
# Optional: bun add redis (for Bull with Redis)

# Phase 5
bun add @nestjs/websockets @nestjs/platform-socket.io socket.io
```

## Success Criteria

- Users can register and authenticate with JWT
- Users can view leaderboards
- Users can search for other users
- Users can follow/unfollow
- Users receive push notifications for key events
- Users can create/join groups
- Users can participate in group challenges
- All features work with existing session/action tracking