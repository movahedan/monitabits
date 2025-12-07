# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the OpenAPI schema package.

## Package Overview

**@repo/schema** is an OpenAPI schema package that provides centralized API definition, interactive Swagger UI documentation, and automated code generation using Kubb. It generates TypeScript types, SWR hooks, and MSW mocks from the OpenAPI specification.

## Essential Commands

### Development
- `bun run dev` - Start Swagger UI development server (port 3005)
- `bun run generate` - Generate TypeScript types, SWR hooks, and MSW mocks from OpenAPI spec
- `bun run build` - Build production bundle and generate code
- `bun run check:types` - Run TypeScript type checking
- `bun run check:types:api` - Run TypeScript type checking on generated API code
- `bun run check` - Run Biome linter/formatter check
- `bun run check:fix` - Auto-fix linting/formatting issues

### Package Structure

```
packages/schema/
├── openapi.yaml          # OpenAPI 3.1.0 specification
├── kubb.config.ts        # Kubb code generation configuration
├── vite.config.ts        # Vite configuration for Swagger UI
├── index.html            # HTML entry point for Swagger UI
├── src/
│   ├── App.tsx           # Swagger UI React component
│   ├── main.tsx           # React entry point
│   ├── index.ts           # Package exports
│   ├── mutator.ts         # HTTP client for generated hooks
│   ├── mutator.d.ts       # Type definitions for mutator
│   └── api/generated/     # Generated code (do not edit manually)
│       ├── schemas/       # TypeScript type definitions
│       ├── hooks/         # SWR hooks for data fetching
│       └── mocks/         # MSW handlers and fixtures
└── package.json
```

## Architecture & Design Patterns

### OpenAPI Specification
The `openapi.yaml` file is the single source of truth for the API contract. It defines:
- All API endpoints and their operations
- Request/response schemas
- Security schemes (device authentication, time validation)
- Tags and organization

### Code Generation Workflow

1. **OpenAPI Spec** (`openapi.yaml`) - Define API contract
2. **Kubb Config** (`kubb.config.ts`) - Configure code generation
3. **Generate Code** (`bun run generate`) - Creates:
   - TypeScript schemas from OpenAPI components
   - SWR hooks for each endpoint
   - MSW mocks for testing
4. **Use Generated Code** - Import and use in frontend/backend

### Generated Code Organization

**Schemas** (`src/api/generated/schemas/`):
- TypeScript interfaces matching OpenAPI components
- Exported from `schemas/index.ts`
- Used for type safety in API requests/responses

**Hooks** (`src/api/generated/hooks/`):
- SWR hooks organized by controller/tag
- Each endpoint has a corresponding hook (e.g., `useGetApiSettings`, `usePostApiSessionsCheckIn`)
- Automatically configured with mutator for HTTP requests

**Mocks** (`src/api/generated/mocks/`):
- MSW handlers for API mocking
- Useful for frontend development and testing
- Generated fixtures using Faker.js

### HTTP Client (Mutator)

The `mutator.ts` file provides the HTTP client used by all generated hooks. It automatically:
- Adds device ID header (`X-Device-Id`)
- Adds time validation headers (`X-Client-Time`, `X-Timezone-Offset`, `X-Timezone-Name`)
- Uses API base URL from environment variables
- Handles error responses in API format

## Usage Patterns

### Importing Generated Types

```typescript
// Import specific schemas
import type { Session, Settings, Action } from '@repo/schema/schemas';

// Import all schemas
import type * as Schemas from '@repo/schema/schemas';
```

### Using Generated SWR Hooks

```typescript
import { useGetApiSettings } from '@repo/schema/hooks';
import { usePostApiSessionsCheckIn } from '@repo/schema/hooks';

function MyComponent() {
  // GET request hook
  const { data, error, isLoading } = useGetApiSettings();
  
  // POST request hook
  const { trigger, isMutating } = usePostApiSessionsCheckIn();
  
  const handleCheckIn = async () => {
    const result = await trigger({
      data: { /* request body */ }
    });
  };
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{JSON.stringify(data)}</div>;
}
```

### Using SWR Directly

```typescript
import useSWR from 'swr';
import { swrFetcher } from '@repo/schema';

function MyComponent() {
  const { data, error } = useSWR('/api/sessions/current', swrFetcher);
  // ...
}
```

### Using Generated Mocks

```typescript
import { handlers } from '@repo/schema/mocks';
import { setupServer } from 'msw/node';

// Setup MSW server with generated handlers
const server = setupServer(...handlers);
```

## Development Guidelines

### Updating the OpenAPI Specification

1. Edit `openapi.yaml` to add/modify endpoints
2. Run `bun run generate` to regenerate code
3. Review generated files in `src/api/generated/`
4. Commit both `openapi.yaml` and generated files

### Code Generation Best Practices

- **Never edit generated files manually** - They will be overwritten
- **Always regenerate after OpenAPI changes** - Run `bun run generate`
- **Review generated code** - Ensure it matches expectations
- **Test generated hooks** - Verify they work with the API

### Adding New Endpoints

1. Add endpoint definition to `openapi.yaml`:
```yaml
paths:
  /api/new-endpoint:
    get:
      tags: [NewTag]
      summary: Get new data
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NewResponse'
```

2. Add schema to `components/schemas` if needed
3. Run `bun run generate`
4. Import and use the new hook: `useGetApiNewEndpoint`

### Environment Variables

The mutator uses these environment variables:
- `NEXT_PUBLIC_API_URL` - API base URL (default: `http://localhost:3003`)
- `API_BASE_URL` - Server-side API base URL (fallback)
- `PORT` or `REPO_PORTS_SCHEMA` - Swagger UI port (default: `3005`)

### Port Configuration

Default port: `3005`

Override with:
```bash
PORT=3006 bun run dev
# or
REPO_PORTS_SCHEMA=3006 bun run dev
```

## Type Safety

### Generated Types

All generated types are fully typed based on the OpenAPI specification:
- Request bodies are validated
- Response types are inferred
- Query parameters are typed
- Path parameters are typed

### Type Usage Example

```typescript
import type { PostApiSessionsCheckIn } from '@repo/schema/schemas';
import { usePostApiSessionsCheckIn } from '@repo/schema/hooks';

// TypeScript knows the exact shape of the request
const { trigger } = usePostApiSessionsCheckIn();

// Type-safe request body
await trigger({
  data: {
    // TypeScript autocomplete and validation
    startTime: new Date().toISOString(),
    lockdownMinutes: 30,
  } satisfies PostApiSessionsCheckIn['requestBody']
});
```

## Kubb Configuration

The `kubb.config.ts` file configures:
- **Input**: OpenAPI specification file path
- **Output**: Generated code directory
- **Plugins**: 
  - `pluginOas` - OpenAPI parsing
  - `pluginTs` - TypeScript schema generation
  - `pluginSwr` - SWR hooks generation

### Plugin Configuration

- **pluginTs**: Generates TypeScript schemas in `schemas/` directory
- **pluginSwr**: Generates SWR hooks in `hooks/` directory, grouped by tags
- **Client Import**: Hooks use `../../mutator` as the HTTP client

## Swagger UI

The Swagger UI provides interactive API documentation:
- Accessible at `http://localhost:3005` (or configured port)
- Shows all endpoints from OpenAPI spec
- Allows testing endpoints directly
- Displays request/response schemas

## Security Headers

The mutator automatically adds security headers:
- `X-Device-Id` - Device identifier for authentication
- `X-Client-Time` - Client timestamp (ISO-8601)
- `X-Timezone-Offset` - Timezone offset in minutes
- `X-Timezone-Name` - Timezone name (IANA)

These headers are required by the API for time validation and device authentication.

## Common Tasks

### Regenerating Code After OpenAPI Changes

```bash
bun run generate
```

This will:
1. Parse `openapi.yaml`
2. Generate TypeScript schemas
3. Generate SWR hooks
4. Format and lint generated code
5. Type-check generated code

### Viewing API Documentation

```bash
bun run dev
# Open http://localhost:3005
```

### Building for Production

```bash
bun run build
```

This builds the Swagger UI bundle and generates all code.

When working with this package, always update the OpenAPI specification first, then regenerate code. Never manually edit generated files. Use the generated hooks and types for type-safe API interactions.
