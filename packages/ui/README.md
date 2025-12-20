# @repo/ui

A React component library built with Vite, providing tree-shakable components with individual exports for optimal performance.

Tree-shakable components with individual exports, full TypeScript support, and Vite-powered builds.

## Installation & Usage

```bash
bun add @repo/ui
```

**Individual imports (recommended for tree-shaking):**

```typescript
import { Button } from '@repo/ui/button/button';
import { Link } from '@repo/ui/link/link';
```

**Barrel import (convenience):**
```typescript
import { Button, Link } from '@repo/ui';
```

**Common commands:**
```bash
bun run dev           # Start Storybook
bun run build         # Build library
bun run check:types   # Type check
bun run test          # Run tests
```

## Architecture

Built with Atomic Design methodology:
- **Atoms**: Basic UI primitives (Button, Input, Card, etc.)
- **Molecules**: Composed components (ActionButton, StatusCard, etc.)
- **Tree-shakable**: Only import what you need for optimal bundle size
- **Type-safe**: Full TypeScript support with proper types
- **Storybook**: Comprehensive component documentation and testing

For detailed architecture, component patterns, and development guidelines, see **[packages/ui/CLAUDE.md](./CLAUDE.md)**

## Key Features

- **Atomic Design**: Organized into atoms (primitives) and molecules (composed)
- **Category-based Imports**: Import from `@repo/ui/atoms` or `@repo/ui/molecules`
- **Automatic Exports**: Components are automatically discovered and exported
- **Multiple Formats**: ESM and CommonJS outputs for maximum compatibility 