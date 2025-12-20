# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the UI component library package.

**IMPORTANT: Always refer to `.cursor/rules/` for development standards.**

## Package Overview

**@repo/ui** is a React component library built with modern tools using **Atomic Design** methodology. It provides tree-shakable, type-safe components organized into atoms, molecules, hooks, and utilities. Built on Radix UI primitives, Tailwind CSS 4, and includes comprehensive Storybook documentation.

## Essential Commands

### Development
- `bun run dev` - Start Storybook development server
- `bun run check:types` - Run TypeScript type checking
- `bun test` - Run component tests

### Storybook
- `bun run dev:storybook` - Start Storybook development server
- `bun run build:storybook` - Build Storybook static site to `dist-storybook/`
- `bun run start` - Serve built Storybook site

## Package Structure

```
packages/ui/
├── src/
│   ├── atoms/               # Basic UI building blocks (53 components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── ... (50+ more)
│   ├── molecules/           # Composed components
│   │   ├── action-button.tsx
│   │   ├── confirmation-modal.tsx
│   │   ├── countdown-timer.tsx
│   │   ├── counter-button/
│   │   ├── progress-metrics.tsx
│   │   └── status-card.tsx
│   ├── hooks/               # React hooks
│   │   ├── index.ts
│   │   └── use-mobile.ts
│   ├── utils/               # Utility functions
│   │   └── index.ts
│   └── styles.css           # Global styles with Tailwind
├── .storybook/              # Storybook configuration
├── package.json
└── README.md
```

## Atomic Design Architecture

### Atoms (53 components)
Basic UI primitives - buttons, inputs, cards, dialogs, etc.
- Accordion, Alert, AlertDialog, AspectRatio, Avatar, Badge
- Breadcrumb, Button, ButtonGroup, Calendar, Card, Carousel
- Chart, Checkbox, Collapsible, Command, ContextMenu, Dialog
- Drawer, DropdownMenu, Empty, Field, Form, HoverCard
- Input, InputGroup, InputOtp, Item, Kbd, Label
- Menubar, NavigationMenu, Pagination, Popover, Progress
- RadioGroup, Resizable, ScrollArea, Select, Separator
- Sheet, Sidebar, Skeleton, Slider, Sonner, Spinner
- Switch, Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip

### Molecules (6 components)
Composed components that combine atoms for specific use cases:
- **ActionButton** - Button with loading states and action handling
- **ConfirmationModal** - Modal for confirming destructive actions
- **CountdownTimer** - Timer display with formatting
- **CounterButton** - Interactive counter with increment/decrement
- **ProgressMetrics** - Display for progress statistics
- **StatusCard** - Card showing status information

### Hooks
- **useMobile** - Hook to detect mobile viewport

### Utils
- Styling utilities (cn helper via @repo/utils)

## Import Strategies

**Category-based Imports (Required)**:
```typescript
// Import atoms
import { Button, Card, Dialog, Input } from '@repo/ui/atoms';

// Import molecules  
import { ActionButton, ProgressMetrics, StatusCard } from '@repo/ui/molecules';

// Import hooks
import { useMobile } from '@repo/ui/hooks';

// Import utils
import { cn } from '@repo/ui/utils';
```

## Technology Stack
- **React 19** with functional components and hooks
- **TypeScript** with strict typing
- **Tailwind CSS 4** for styling
- **Radix UI** for accessible primitives
- **Class Variance Authority** for component variants
- **Storybook 9** for component documentation and testing
- **Lucide React** for iconography
- **React Hook Form** with Zod resolver for forms

## Component Guidelines

### Component Structure
```typescript
// Example component pattern
import { cn } from '@repo/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

### Key Patterns
1. **Atomic Design** - Atoms for primitives, Molecules for composed components
2. **Variant-based styling** using Class Variance Authority
3. **Forward refs** for proper component composition
4. **Accessible primitives** from Radix UI
5. **Type-safe props** with proper TypeScript interfaces
6. **Utility-first styling** with Tailwind CSS

### Testing Patterns
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders button with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
});
```

## Storybook Integration

### Story Structure
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: 'Button' },
};
```

### Available Addons
- **@storybook/addon-a11y** - Accessibility testing
- **@storybook/addon-links** - Navigation between stories
- **@storybook/addon-themes** - Theme switching
- **@storybook/testing-library** - User interaction testing

## Development Guidelines

### Adding New Components
1. Determine category: **atoms** (primitive) or **molecules** (composed)
2. Create component in appropriate directory
3. Implement with TypeScript and proper typing
4. Add Storybook stories
5. Write component tests
6. Export from category's `index.ts`

### Styling Guidelines
- Use Tailwind CSS utility classes
- Leverage CVA for component variants
- Follow design system patterns
- Ensure responsive design
- Maintain accessibility standards

### Dependencies
- **Radix UI**: Use for complex interactive components
- **Lucide React**: Use for consistent iconography
- **clsx/tailwind-merge**: Use via `@repo/utils` cn() helper
- **Class Variance Authority**: Use for variant management

## Type Safety

### Component Props
```typescript
// Always define explicit interfaces
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined';
  children: React.ReactNode;
}

// Use proper generic typing for forwarded refs
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props}>
        {children}
      </div>
    );
  }
);
```

### Export Types
Always export component prop types for external consumption:
```typescript
export type { ButtonProps, CardProps } from './component';
```

When working with this package, follow the Atomic Design methodology - atoms for primitives, molecules for composed components. Always include Storybook stories and tests for new components.
