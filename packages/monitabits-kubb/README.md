# @repo/monitabits-kubb

Kubb-generated API client with TypeScript types, SWR hooks, and Zod schemas.

## Overview

This package provides auto-generated code from the OpenAPI specification:
- **TypeScript types** - Type definitions for API requests/responses
- **SWR hooks** - Data fetching hooks for React
- **Zod schemas** - Runtime validation schemas
- **HTTP client** - Configured mutator with automatic headers

## Overview

Auto-generated API client from OpenAPI specification:
- **Types**: TypeScript type definitions
- **Hooks**: SWR hooks for React data fetching
- **Server Functions**: Functions for Server Components
- **Schemas**: Zod validation schemas

## Quick Start

```typescript
// Server Components
import { sessionsControllerGetCurrentSession } from '@repo/monitabits-kubb/server';

// Client Components  
import { useSessionsControllerGetCurrentSession } from '@repo/monitabits-kubb/hooks';

// Types
import type { SessionDto } from '@repo/monitabits-kubb/types';
```

For detailed usage patterns, architecture, and development guidelines, see **[packages/monitabits-kubb/CLAUDE.md](./CLAUDE.md)**
