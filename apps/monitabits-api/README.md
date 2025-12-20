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

This will start the API on port 3003, generate `openapi.yaml` from DTOs, and run Kubb to generate types/hooks/zod in `@repo/monitabits-kubb`.

**Database commands:**
```bash
bun run db:generate       # Generate Prisma Client
bun run db:migrate        # Create and apply migrations
bun run db:studio         # Open Prisma Studio GUI
```

**API Documentation:** Swagger UI at http://localhost:3005 (via `monitabits-swagger` app)

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

## Architecture

- **DTOs as Source of Truth**: DTOs use `@ApiProperty` decorators that generate OpenAPI schema
- **Automatic Code Generation**: OpenAPI spec triggers Kubb to generate frontend types/hooks
- **Validation**: Headers validated by guards, request bodies by Zod schemas
- **Response Format**: Consistent response wrapping via interceptors

For detailed architecture and implementation patterns, see **[apps/monitabits-api/CLAUDE.md](./CLAUDE.md)**
