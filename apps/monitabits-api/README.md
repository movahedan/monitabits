# Monitabits API

NestJS API server for the Monitabits application.

## Overview

This API provides:
- **REST endpoints** with NestJS controllers
- **DTOs with @ApiProperty** - Source of truth for OpenAPI schema
- **Prisma ORM** - PostgreSQL database access
- **Automatic OpenAPI generation** - Writes `openapi.yaml` and triggers Kubb on startup

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up postgres -d
```

### 2. Set Environment Variables

Create `.env` in root directory:
```env
DATABASE_URL="postgresql://monitabits:monitabits@localhost:5432/monitabits?schema=public"
POSTGRES_USER=monitabits
POSTGRES_PASSWORD=monitabits
POSTGRES_DB=monitabits
```

### 3. Setup Database

```bash
cd apps/monitabits-api
bun run db:generate   # Generate Prisma Client
bun run db:migrate    # Run migrations
```

### 4. Start Development

```bash
bun run dev
```

This will:
1. Start the API on port 3003
2. Generate `openapi.yaml` from DTOs
3. Run Kubb to generate types/hooks/zod in `@repo/monitabits-kubb`

## Project Structure

```
apps/monitabits-api/
├── prisma/
│   └── schema.prisma     # Database schema
├── prisma.config.ts      # Prisma configuration
├── src/
│   ├── common/
│   │   ├── models/       # DTOs with @ApiProperty (OpenAPI source)
│   │   ├── validators/   # Header validation (X-Device-Id, X-Client-Time)
│   │   ├── guards/       # Auth and time validation guards
│   │   ├── pipes/        # Zod validation pipe
│   │   ├── filters/      # Exception filters
│   │   └── services/     # Prisma service
│   ├── actions/          # Actions module (cheat, harm, follow-up)
│   ├── sessions/         # Sessions module (check-in, check-out)
│   ├── settings/         # Settings module
│   ├── statistics/       # Statistics module
│   ├── swagger.setup.ts  # OpenAPI generation + Kubb trigger
│   └── main.ts           # Application entry
└── package.json
```

## Database Commands

```bash
bun run db:generate       # Generate Prisma Client
bun run db:migrate        # Create and apply migrations
bun run db:migrate:deploy # Apply migrations (production)
bun run db:studio         # Open Prisma Studio GUI
bun run db:reset          # Reset database (WARNING: deletes data)
```

## API Documentation

- **Swagger UI**: http://localhost:3005 (via `monitabits-swagger` app)
- **OpenAPI spec**: Auto-generated at `packages/monitabits-kubb/src/openapi.yaml`

## Architecture

### DTOs as Source of Truth

DTOs in `src/common/models/` use `@ApiProperty` decorators:

```typescript
export class SettingsDto {
  @ApiProperty({ type: Number, minimum: 1, maximum: 10080 })
  readonly lockdownMinutes!: number;
}
```

These generate the OpenAPI schema, which Kubb uses to generate frontend code.

### Validation Flow

1. **Headers** validated by guards (`DeviceAuthGuard`, `TimeValidationGuard`)
2. **Request bodies** validated by `ZodValidationPipe` with Zod schemas
3. **Response format** wrapped by `TransformInterceptor`
