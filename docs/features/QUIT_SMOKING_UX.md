# 🎨 Cigarette Quitting Application - UX Guidelines

> User experience design principles and patterns for the quit smoking accountability application.

## 📋 Table of Contents

- [Design Philosophy](#-design-philosophy)
- [Visual Design Principles](#-visual-design-principles)
- [User Flows](#-user-flows)
- [Component Patterns](#-component-patterns)
- [States & Interactions](#-states--interactions)
- [Accessibility](#-accessibility)
- [Mobile-First Design](#-mobile-first-design)

## 🎯 Design Philosophy

### Core Principles

1. **Clarity Over Decoration**: Every element serves a purpose. No unnecessary visual noise.
2. **Honest Communication**: The app should be direct and honest, matching the user's self-accountability journey.
3. **Immediate Feedback**: All actions should provide instant, clear feedback.
4. **Reduced Friction**: Minimize steps between user intent and action completion.
5. **Emotional Resonance**: Design should acknowledge the difficulty of quitting while maintaining hope.

### Design Tone

- **Direct**: Clear, unambiguous language
- **Supportive**: Encouraging without being preachy
- **Accountable**: Serious but not judgmental
- **Minimal**: Focus on essential information only

## 🎨 Visual Design Principles

### Color Palette

#### Primary Colors
- **Timer Running State**: 
  - Primary: `#3B82F6` (Blue-600) - Active, focused
  - Background: `#DBEAFE` (Blue-100) - Calm, productive
- **Timer Paused State**: 
  - Primary: `#F59E0B` (Amber-500) - Paused, attention
  - Background: `#FEF3C7` (Amber-100) - Soft warning
- **Timer Completed State**: 
  - Primary: `#059669` (Green-600) - Success, achievement
  - Background: `#D1FAE5` (Green-100) - Positive reinforcement
- **Timer Idle State**: 
  - Primary: `#6B7280` (Gray-500) - Information, neutral
  - Background: `#F9FAFB` (Gray-50) - Clean, minimal

#### Semantic Colors
- **Warning**: `#F59E0B` (Amber-500) - Attention needed
- **Info**: `#3B82F6` (Blue-500) - Information
- **Success**: `#10B981` (Green-500) - Achievement
- **Danger**: `#EF4444` (Red-500) - Critical actions

### Typography

#### Hierarchy
- **Hero/Countdown**: Large, bold, monospace for time display
  - Size: `4rem` (64px) on desktop, `3rem` (48px) on mobile
  - Weight: `700` (Bold)
  - Font: System monospace or `'JetBrains Mono'`
  
- **Headings**: Clear section titles
  - H1: `2rem` (32px), Weight: `600`
  - H2: `1.5rem` (24px), Weight: `600`
  - H3: `1.25rem` (20px), Weight: `500`

- **Body Text**: Readable, comfortable
  - Size: `1rem` (16px)
  - Weight: `400` (Regular)
  - Line Height: `1.5`

- **Button Text**: Clear, action-oriented
  - Size: `1rem` (16px)
  - Weight: `500` (Medium)

### Spacing System

Based on 8px grid:
- **XS**: `0.25rem` (4px)
- **SM**: `0.5rem` (8px)
- **MD**: `1rem` (16px)
- **LG**: `1.5rem` (24px)
- **XL**: `2rem` (32px)
- **2XL**: `3rem` (48px)
- **3XL**: `4rem` (64px)

### Border Radius

- **Small**: `0.25rem` (4px) - Buttons, inputs
- **Medium**: `0.5rem` (8px) - Cards, containers
- **Large**: `1rem` (16px) - Modals, large cards

### Shadows

- **Small**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **Medium**: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- **Large**: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`

## 🔄 User Flows

### Flow 1: Opening App (Blocked State)

```
User Opens App
    ↓
Check Session Status (API Call)
    ↓
[Blocked State]
    ↓
Display Countdown Timer
    ↓
Show "I Cheated" Button
    ↓
[User Clicks Button]
    ↓
Show Confirmation Modal
    ↓
[User Confirms]
    ↓
Log Action (API Call)
    ↓
Update UI (Show Consequences Message)
    ↓
Refresh Countdown
```

### Flow 2: Opening App (Active State)

```
User Opens App
    ↓
Check Session Status (API Call)
    ↓
[Active State]
    ↓
Display Time Ahead Metric
    ↓
Show Progress Statistics
    ↓
Show "I'm Choosing to Harm Myself" Button
    ↓
[User Clicks Button]
    ↓
Show Confirmation Modal
    ↓
[User Confirms]
    ↓
Start Lockdown Period (API Call)
    ↓
Transition to Blocked State
    ↓
Show Lockdown Started Message
```

### Flow 3: Settings

```
User Clicks Settings Icon
    ↓
Navigate to Settings Page
    ↓
Display Current Lockdown Period
    ↓
Show Input Field
    ↓
[User Enters New Value]
    ↓
Show Save Button
    ↓
[User Clicks Save]
    ↓
Validate Input (Client + Server)
    ↓
Save Settings (API Call)
    ↓
Show Success Message
    ↓
Return to Main Page
```

### Flow 4: Reflection Questions

```
App Detects Time for Reflection
    ↓
Show Reflection Modal (Non-blocking)
    ↓
Display Question
    ↓
[User Responds]
    ↓
Save Response (API Call)
    ↓
Show Thank You Message
    ↓
Close Modal
```

## 🧩 Component Patterns

### 1. Countdown Timer Component

**Purpose**: Display remaining lockdown time

**Visual Design**:
- Large, monospace font
- Red color scheme when blocked
- Smooth countdown animation
- Format: `HH:MM:SS` or `MM:SS` for shorter periods

**States**:
- **Active Countdown**: Animated, red background
- **Expired**: Transition animation to green

**Accessibility**:
- ARIA live region for screen readers
- Announce time updates every 10 seconds

### 2. Action Button Component

**Purpose**: Primary user actions

**Variants**:
- **"I Cheated"**: Red, outlined style
- **"I'm Choosing to Harm Myself"**: Red, filled style
- **"Save Settings"**: Blue, filled style

**States**:
- **Default**: Normal appearance
- **Hover**: Slight scale (1.02x), shadow increase
- **Active/Pressed**: Scale down (0.98x)
- **Loading**: Spinner, disabled state
- **Disabled**: Reduced opacity, no interaction

**Size**:
- Height: `3rem` (48px)
- Padding: `1rem 2rem` (16px 32px)
- Font: `1rem`, Weight: `500`

### 3. Status Card Component

**Purpose**: Display current state and metrics

**Layout**:
- Centered content
- Large metric display
- Supporting text below
- Icon or emoji indicator

**States**:
- **Blocked**: Red theme, lock icon
- **Active**: Green theme, checkmark icon

### 4. Confirmation Modal Component

**Purpose**: Confirm critical actions

**Design**:
- Backdrop overlay (semi-transparent)
- Centered modal card
- Clear question/statement
- Two buttons: Cancel (outlined) and Confirm (filled)
- Escape key to close

**Content**:
- Title: Action description
- Body: Consequences explanation
- Actions: Cancel, Confirm

### 5. Settings Input Component

**Purpose**: Configure lockdown period

**Design**:
- Label above input
- Number input with min/max validation
- Helper text below
- Save button (disabled until change)

**Validation**:
- Real-time validation
- Error message display
- Visual feedback (red border on error)

### 6. Progress Metrics Component

**Purpose**: Show time saved and progress

**Metrics Display**:
- **Time Ahead**: Large number with unit
- **Total Time Saved**: Cumulative metric
- **Streak**: Consecutive periods completed
- **Last Relapse**: Time since last action

**Visualization**:
- Progress bar for current period
- Small charts/graphs for trends
- Color-coded by performance

## 🎭 States & Interactions

### Main Dashboard States

#### Blocked State
```
┌─────────────────────────────┐
│   🔒 LOCKED DOWN            │
│                             │
│   02:34:12                  │
│   (Large, red, monospace)   │
│                             │
│   Time remaining until      │
│   you can make a choice     │
│                             │
│   ┌─────────────────────┐  │
│   │ I Cheated and        │  │
│   │ Dishonored Myself    │  │
│   └─────────────────────┘  │
└─────────────────────────────┘
```

#### Active State
```
┌─────────────────────────────┐
│   ✅ You're Ahead!          │
│                             │
│   3h 45m                    │
│   (Large, green)            │
│                             │
│   Ahead of your plan        │
│                             │
│   ┌─────────────────────┐  │
│   │ I'm Choosing to     │  │
│   │ Harm Myself         │  │
│   └─────────────────────┘  │
│                             │
│   📊 Progress Stats         │
│   • Total saved: 2d 5h      │
│   • Current streak: 3       │
└─────────────────────────────┘
```

### Interaction Patterns

#### Button Interactions
- **Hover**: 200ms transition, scale 1.02x
- **Click**: 100ms transition, scale 0.98x
- **Loading**: Spinner replaces text, button disabled
- **Success**: Brief green flash, then normal state

#### Modal Interactions
- **Open**: Fade in backdrop (200ms), slide up modal (300ms)
- **Close**: Fade out backdrop (200ms), slide down modal (300ms)
- **Backdrop Click**: Close modal
- **Escape Key**: Close modal

#### Form Interactions
- **Focus**: Border color change, slight scale
- **Error**: Shake animation (300ms), red border
- **Success**: Green checkmark icon, green border

## ♿ Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast
- Text on background: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Interactive elements: Minimum 3:1 ratio

#### Keyboard Navigation
- All interactive elements keyboard accessible
- Tab order follows visual flow
- Focus indicators clearly visible
- Escape key closes modals

#### Screen Readers
- Semantic HTML elements
- ARIA labels for icons and buttons
- ARIA live regions for dynamic content
- Descriptive alt text for images

#### Motion
- Respect `prefers-reduced-motion` media query
- Provide option to disable animations
- Critical information not conveyed by motion alone

### Implementation Examples

```tsx
// Accessible button
<button
  aria-label="I cheated and dishonored myself"
  className="action-button"
  onClick={handleCheat}
>
  I Cheated and Dishonored Myself
</button>

// Accessible countdown
<div
  role="timer"
  aria-live="polite"
  aria-atomic="true"
  aria-label={`Time remaining: ${formattedTime}`}
>
  {formattedTime}
</div>

// Accessible modal
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Action</h2>
  <p id="modal-description">This will log your action...</p>
</div>
```

## 📱 Mobile-First Design

### Breakpoints

- **Mobile**: `0px - 640px` (default)
- **Tablet**: `641px - 1024px`
- **Desktop**: `1025px+`

### Mobile Considerations

#### Touch Targets
- Minimum size: `44px × 44px`
- Adequate spacing between interactive elements
- No hover states (use active states)

#### Layout
- Single column layout on mobile
- Stacked elements vertically
- Full-width buttons
- Bottom sheet for modals on mobile

#### Typography
- Slightly smaller font sizes
- Increased line height for readability
- Touch-friendly input fields

#### Performance
- Optimize images and assets
- Lazy load non-critical content
- Minimize JavaScript bundle size
- Fast initial load time

### Responsive Patterns

```css
/* Mobile-first approach */
.countdown {
  font-size: 2rem; /* Mobile */
}

@media (min-width: 641px) {
  .countdown {
    font-size: 3rem; /* Tablet */
  }
}

@media (min-width: 1025px) {
  .countdown {
    font-size: 4rem; /* Desktop */
  }
}
```

## 🎨 Design Tokens

### Spacing Scale
```typescript
const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};
```

### Color Tokens
```typescript
const colors = {
  // States
  blocked: {
    primary: '#DC2626',
    background: '#FEE2E2',
    text: '#991B1B',
  },
  active: {
    primary: '#059669',
    background: '#D1FAE5',
    text: '#047857',
  },
  // Semantic
  warning: '#F59E0B',
  info: '#3B82F6',
  success: '#10B981',
  danger: '#EF4444',
};
```

### Typography Scale
```typescript
const typography = {
  hero: {
    fontSize: '4rem',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h1: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  body: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
};
```

## 🔗 Related Documentation

- [Project Proposal](./QUIT_SMOKING_PROPOSAL.md)
- [Database & API Design](./QUIT_SMOKING_DATABASE_API.md)
- [Frontend Structure](./QUIT_SMOKING_FRONTEND.md)
- [Design System Prompt](./QUIT_SMOKING_DESIGN_SYSTEM.md)

---

**Design Philosophy**: Keep it simple, honest, and focused. Every pixel should serve the user's journey toward quitting smoking.
