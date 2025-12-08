# Monitabits Swagger UI

Vite-based application for displaying Swagger UI documentation.

## Overview

This app provides an interactive Swagger UI interface for the Monitabits API documentation. It reads the OpenAPI specification from `@repo/monitabits-kubb` and renders it using `swagger-ui-react`.

## Development

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Configuration

- **Port**: Default `3005` (override with `PORT` env var)
- **Host**: Default `localhost` (override with `HOST` env var)

## Architecture

- **Vite** - Build tool and dev server
- **React** - UI framework
- **swagger-ui-react** - Swagger UI component
- **@repo/monitabits-kubb** - Provides the OpenAPI YAML spec

## How It Works

1. API generates `openapi.yaml` from `@ApiProperty` decorators on startup
2. OpenAPI spec is written to `packages/monitabits-kubb/src/openapi.yaml`
3. This app reads that spec and renders Swagger UI

The app is intentionally simple - it just renders Swagger UI with the generated schema.
