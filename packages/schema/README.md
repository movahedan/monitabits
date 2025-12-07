# @repo/schema

OpenAPI schema package with Swagger UI and Kubb code generation for the Monitabits API.

## Overview

This package provides:
- OpenAPI 3.1.0 specification (`openapi.yaml`)
- Swagger UI interface for API documentation
- Code generation via Kubb (TypeScript types, SWR hooks, MSW mocks)
- HTTP client with automatic headers (device ID, time validation)

## Development

### Start Swagger UI

```bash
bun run dev
```

This will start a Vite dev server on port 3005 (or the port specified in `REPO_PORTS_SCHEMA`).

### Generate Code

Generate TypeScript types, SWR hooks, and MSW mocks from the OpenAPI spec:

```bash
bun run generate
# or
bun run build
```

Generated files will be in `src/api/generated/`:
- `schemas/` - TypeScript type definitions
- `hooks/` - SWR hooks for data fetching
- `mocks/` - MSW handlers and fixtures

## Structure

```
packages/schema/
├── openapi.yaml          # OpenAPI specification
├── kubb.config.ts        # Kubb code generation config
├── vite.config.ts        # Vite configuration
├── index.html            # HTML entry point
├── src/
│   ├── mutator.ts        # HTTP client for Kubb-generated hooks
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Swagger UI component
│   ├── index.ts          # Package exports
│   ├── utils/
│   │   ├── device.ts     # Device ID management
│   │   ├── time.ts       # Time utilities
│   │   └── api.ts        # API utilities
│   └── api/generated/    # Generated code (after running kubb)
│       ├── schemas/      # TypeScript types
│       ├── hooks/        # SWR hooks
│       └── mocks/        # MSW mocks
└── scripts/
    └── dev.ts           # Development server script
```

## Usage

### In Frontend

Import generated SWR hooks:

```typescript
import { useGetSessionsCurrent } from '@repo/schema/hooks';
import { swrFetcher, swrConfig } from '@repo/schema';

// Use in component
function MyComponent() {
  const { data, error, isLoading } = useGetSessionsCurrent();
  
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

### HTTP Client

The mutator automatically:
- Adds device ID header (`X-Device-Id`)
- Adds time validation headers (`X-Client-Time`, `X-Timezone-Offset`, `X-Timezone-Name`)
- Uses API base URL from `NEXT_PUBLIC_API_URL` environment variable
- Handles error responses

## Environment Variables

- `NEXT_PUBLIC_API_URL` - API base URL (default: `http://localhost:3003`)
- `API_BASE_URL` - Server-side API base URL (fallback)

## Port Configuration

Default port: `3005`

Override with environment variable:
- `PORT` or `REPO_PORTS_SCHEMA`

## Features

- ✅ **Automatic Headers**: Device ID and time validation headers added automatically
- ✅ **SWR Integration**: Generated hooks use SWR for data fetching
- ✅ **Type Safety**: Full TypeScript support with generated types
- ✅ **Error Handling**: Proper error handling with API error format
- ✅ **Environment Aware**: Works in both client and server contexts
