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
│   └── schema.prisma       # Database schema
├── prisma.config.ts        # Prisma configuration
├── src/
│   ├── common/
│   │   ├── models/         # DTOs with @ApiProperty decorators
│   │   │   ├── action.model.ts
│   │   │   ├── response.model.ts
│   │   │   ├── session.model.ts
│   │   │   ├── settings.model.ts
│   │   │   └── statistics.model.ts
│   │   ├── validators/     # Header validation
│   │   │   └── headers.ts  # validateDeviceId, validateClientTime
│   │   ├── guards/         # Authentication guards
│   │   │   ├── device-auth.guard.ts
│   │   │   └── time-validation.guard.ts
│   │   ├── pipes/          # Validation pipes
│   │   │   └── zod-validation.pipe.ts
│   │   ├── filters/        # Exception filters
│   │   ├── interceptors/   # Response transformation
│   │   └── services/       # Prisma service
│   ├── actions/            # Actions module
│   ├── sessions/           # Sessions module
│   ├── settings/           # Settings module
│   ├── statistics/         # Statistics module
│   ├── swagger.setup.ts    # OpenAPI generation
│   ├── app.module.ts       # Root module
│   └── main.ts             # Entry point
├── tsconfig.json
└── package.json
```

## Architecture

### DTOs as OpenAPI Source of Truth

DTOs in `src/common/models/` define both TypeScript types and OpenAPI schema:

```typescript
// src/common/models/settings.model.ts
import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export class SettingsDto {
  @ApiProperty({ type: Number, minimum: 1, maximum: 10080 })
  readonly lockdownMinutes!: number;

  @ApiProperty({ type: String, format: "date-time" })
  readonly updatedAt!: string;
}

// Zod schema for runtime validation
export const SettingsSchema = z.object({
  lockdownMinutes: z.number().int().min(1).max(10080),
  updatedAt: z.string().datetime(),
});

// TypeScript type
export type Settings = z.infer<typeof SettingsSchema>;
```

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
@Controller("settings")
@ApiTags("Settings")
@UseGuards(DeviceAuthGuard, TimeValidationGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: "Get user settings" })
  @ApiResponse({ status: 200, type: SettingsDto })
  async getSettings(@DeviceId() deviceId: string): Promise<Settings> {
    return this.settingsService.getSettings(deviceId);
  }

  @Put()
  @ApiOperation({ summary: "Update settings" })
  @UsePipes(new ZodValidationPipe(UpdateSettingsRequestSchema))
  async updateSettings(
    @DeviceId() deviceId: string,
    @Body() data: UpdateSettingsRequest,
  ): Promise<Settings> {
    return this.settingsService.updateSettings(deviceId, data);
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
