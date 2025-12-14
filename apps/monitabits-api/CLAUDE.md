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
│   │   │   └── device-id.decorator.ts
│   │   ├── filters/          # Exception filters
│   │   │   ├── all-exceptions.filter.ts
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/           # Authentication guards
│   │   │   └── device-auth.guard.ts
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
│   ├── timer/                # Timer module (Pomodoro timer)
│   │   ├── timer.model.ts    # Timer, TimerResponse, StartTimerRequest
│   │   ├── timer.controller.ts
│   │   ├── timer.module.ts
│   │   └── timer.service.ts
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
// src/timer/timer.model.ts
import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export class TimerDto {
  @ApiProperty({ type: String })
  readonly id!: string;

  @ApiProperty({ enum: ["idle", "running", "paused", "completed"] })
  readonly status!: "idle" | "running" | "paused" | "completed";

  @ApiProperty({ enum: ["work", "short_break", "long_break"] })
  readonly type!: "work" | "short_break" | "long_break";

  @ApiProperty({ type: Number })
  readonly durationSeconds!: number;

  @ApiProperty({ type: Number })
  readonly remainingSeconds!: number;

  @ApiProperty({ type: String, nullable: true })
  readonly startedAt!: string | null;

  @ApiProperty({ type: String, nullable: true })
  readonly pausedAt!: string | null;
}

// Zod schema for runtime validation
export const TimerSchema = z.object({
  id: z.string(),
  status: z.enum(["idle", "running", "paused", "completed"]),
  type: z.enum(["work", "short_break", "long_break"]),
  durationSeconds: z.number(),
  remainingSeconds: z.number(),
  startedAt: z.string().nullable(),
  pausedAt: z.string().nullable(),
});

// TypeScript type
export type Timer = z.infer<typeof TimerSchema>;
```

### Key Timer Types

- **Timer**: Current Pomodoro timer state (id, status, type, durationSeconds, remainingSeconds, startedAt, pausedAt)
- **TimerResponse**: Wrapped timer response for `/timer/current` and timer operations
- **StartTimerRequest**: Request to start a timer with type (work, short_break, long_break)

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
@Controller("timer")
@ApiTags("Timer")
@UseGuards(DeviceAuthGuard)
export class TimerController {
  constructor(private readonly timerService: TimerService) {}

  @Get("current")
  @ApiOperation({ summary: "Get current timer status" })
  @ApiResponse({ status: 200, type: TimerResponseDto })
  async getCurrentTimer(
    @DeviceId() deviceId: string,
  ): Promise<TimerResponse> {
    return this.timerService.getTimer(deviceId);
  }

  @Post("start")
  @ApiOperation({ summary: "Start a timer" })
  @ApiResponse({ status: 200, type: TimerResponseDto })
  async startTimer(
    @DeviceId() deviceId: string,
    @Body(new ZodValidationPipe(StartTimerRequestSchema)) request: StartTimerRequest,
  ): Promise<TimerResponse> {
    return this.timerService.startTimer(deviceId, request);
  }

  @Post("pause")
  @ApiOperation({ summary: "Pause the timer" })
  @ApiResponse({ status: 200, type: TimerResponseDto })
  async pauseTimer(
    @DeviceId() deviceId: string,
  ): Promise<TimerResponse> {
    return this.timerService.pauseTimer(deviceId);
  }

  @Post("resume")
  @ApiOperation({ summary: "Resume the timer" })
  @ApiResponse({ status: 200, type: TimerResponseDto })
  async resumeTimer(
    @DeviceId() deviceId: string,
  ): Promise<TimerResponse> {
    return this.timerService.resumeTimer(deviceId);
  }

  @Post("reset")
  @ApiOperation({ summary: "Reset the timer" })
  @ApiResponse({ status: 200, type: TimerResponseDto })
  async resetTimer(
    @DeviceId() deviceId: string,
  ): Promise<TimerResponse> {
    return this.timerService.resetTimer(deviceId);
  }
}
```

## Database

### Prisma Schema Location

`apps/monitabits-api/prisma/schema.prisma`

### Models

- **Device** - Device identification
- **Timer** - Pomodoro timer state (idle, running, paused, completed)
- **PomodoroSession** - Completed Pomodoro sessions (work, short_break, long_break)
- **Settings** - Device settings (workMinutes, shortBreakMinutes, longBreakMinutes)

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

### Guards

- **DeviceAuthGuard** - Validates `X-Device-Id` header

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
