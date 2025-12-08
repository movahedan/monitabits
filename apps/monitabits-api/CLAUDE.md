# CLAUDE.md

This file provides guidance for working with the monitabits-api application.

## Application Overview

**monitabits-api** is a NestJS API server that provides:
- REST endpoints for the Monitabits application
- DTOs with `@ApiProperty` decorators (source of truth for OpenAPI)
- Prisma ORM for PostgreSQL database access
- Automatic OpenAPI generation and Kubb code generation on startup

**Port**: 3003

## Essential Commands

### Development
```bash
bun run dev           # Start with hot reload, generates OpenAPI + runs Kubb
bun run build         # Build for production
bun run start         # Start production server
bun run check:types   # TypeScript type checking
```

### Database
```bash
bun run db:generate       # Generate Prisma Client
bun run db:migrate        # Create and apply migrations
bun run db:migrate:deploy # Apply migrations (production)
bun run db:studio         # Open Prisma Studio
bun run db:reset          # Reset database (deletes data!)
```

## Project Structure

```
apps/monitabits-api/
├── prisma/
│   └── schema.prisma         # Database schema
├── prisma.config.ts          # Prisma configuration
├── src/
│   ├── common/
│   │   ├── decorators/       # Custom decorators
│   │   │   ├── client-time.decorator.ts
│   │   │   └── device-id.decorator.ts
│   │   ├── filters/          # Exception filters
│   │   │   ├── all-exceptions.filter.ts
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/           # Authentication guards
│   │   │   ├── device-auth.guard.ts
│   │   │   └── time-validation.guard.ts
│   │   ├── interceptors/     # Response transformation
│   │   │   └── transform.interceptor.ts
│   │   ├── models/           # Shared response DTOs
│   │   │   └── response.model.ts
│   │   ├── pipes/            # Validation pipes
│   │   │   └── zod-validation.pipe.ts
│   │   ├── services/         # Prisma service
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   └── validators/       # Header validation
│   │       └── headers.ts
│   ├── actions/              # Actions module (cheat, harm, follow-up)
│   │   ├── action.model.ts
│   │   ├── actions.controller.ts
│   │   ├── actions.module.ts
│   │   └── actions.service.ts
│   ├── sessions/             # Sessions module (check-in/out, current)
│   │   ├── session.model.ts  # Session, CheckIn, UserStats, CurrentSessionResponse
│   │   ├── sessions.controller.ts
│   │   ├── sessions.module.ts
│   │   └── sessions.service.ts
│   ├── settings/             # Settings module
│   │   ├── settings.model.ts
│   │   ├── settings.controller.ts
│   │   ├── settings.module.ts
│   │   └── settings.service.ts
│   ├── statistics/           # Statistics module
│   │   ├── statistics.model.ts
│   │   ├── statistics.controller.ts
│   │   ├── statistics.module.ts
│   │   └── statistics.service.ts
│   ├── swagger.setup.ts      # OpenAPI generation
│   ├── app.module.ts         # Root module
│   └── index.ts              # Entry point
├── tsconfig.json
└── package.json
```

## Architecture

### DTOs as OpenAPI Source of Truth

Each module has its own model file defining DTOs with `@ApiProperty` decorators:

```typescript
// src/sessions/session.model.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { z } from "zod";

export class SessionDto {
  @ApiProperty({ type: String, format: "uuid" })
  readonly id!: string;

  @ApiProperty({ enum: ["active", "locked", "completed"] })
  readonly status!: SessionStatus;

  @ApiPropertyOptional({ type: Number, nullable: true })
  readonly timeRemaining?: number | null;
}

// Zod schema for runtime validation
export const SessionSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "locked", "completed"]),
  timeRemaining: z.number().int().nullable().optional(),
});

// TypeScript type
export type Session = z.infer<typeof SessionSchema>;
```

### Key Session Types

- **Session**: Current lockdown session state (id, status, timeRemaining, timeAhead)
- **UserStats**: User progress stats (totalTimeSaved, currentStreak, lastRelapse)
- **CurrentSessionResponse**: Combined session + user stats for `/sessions/current`

### OpenAPI Generation Flow

When the API starts in dev mode:

1. **NestJS Swagger** extracts `@ApiProperty` metadata from DTOs
2. **`swagger.setup.ts`** writes OpenAPI spec to `packages/monitabits-kubb/src/openapi.yaml`
3. **Kubb runs automatically** and generates types/hooks/zod in `@repo/monitabits-kubb`

### Validation Strategy

- **Headers**: Validated by guards using `src/common/validators/`
- **Request bodies**: Validated by `ZodValidationPipe` with Zod schemas
- **Responses**: Wrapped by `TransformInterceptor` in `SuccessResponse<T>` format

### Controller Pattern

```typescript
@Controller("sessions")
@ApiTags("Sessions")
@UseGuards(DeviceAuthGuard, TimeValidationGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get("current")
  @ApiOperation({ summary: "Get current session and user stats" })
  @ApiResponse({ status: 200, type: CurrentSessionResponseDto })
  async getCurrentSession(
    @DeviceId() deviceId: string,
  ): Promise<CurrentSessionResponse> {
    return this.sessionsService.getCurrentSession(deviceId);
  }

  @Post("check-in")
  @ApiOperation({ summary: "Create check-in" })
  @ApiResponse({ status: 201, type: CheckInResponseDto })
  async checkIn(
    @DeviceId() deviceId: string,
    @ClientTime() clientTime: Date,
  ): Promise<CheckInResponse> {
    return this.sessionsService.createCheckIn(deviceId, clientTime, "check_in");
  }
}
```

## Database

### Prisma Schema Location

`apps/monitabits-api/prisma/schema.prisma`

### Models

- **Device** - Device identification
- **Session** - Lockdown sessions
- **Action** - User actions (cheat, harm)
- **CheckIn** - Session check-ins
- **Settings** - Device settings
- **FollowUp** - Follow-up questions/answers

### Running Migrations

```bash
# Development
bun run db:migrate

# Production
bun run db:migrate:deploy
```

## Security

### Request Headers

All requests require:
- `X-Device-Id` - UUID device identifier
- `X-Client-Time` - ISO-8601 timestamp (validated ±5 minutes of server time)

### Guards

- **DeviceAuthGuard** - Validates `X-Device-Id` header
- **TimeValidationGuard** - Validates `X-Client-Time` header, prevents time manipulation

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/settings"
}
```

## Related Documentation

- **[packages/monitabits-kubb/CLAUDE.md](../../packages/monitabits-kubb/CLAUDE.md)** - Generated API client
- **[apps/monitabits-swagger/README.md](../monitabits-swagger/README.md)** - Swagger UI
- **[docs/features/QUIT_SMOKING_DATABASE_API.md](../../docs/features/QUIT_SMOKING_DATABASE_API.md)** - Full API design
