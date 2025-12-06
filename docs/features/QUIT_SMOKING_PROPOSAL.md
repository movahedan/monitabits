# 🚭 Cigarette Quitting Application - Project Proposal

> A self-accountability application designed to help users quit smoking through time-based restrictions, progress tracking, and anti-cheat mechanisms.

## 📋 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Core Features](#-core-features)
- [Technical Requirements](#-technical-requirements)
- [Security Considerations](#-security-considerations)
- [User Stories](#-user-stories)
- [Success Metrics](#-success-metrics)
- [Implementation Phases](#-implementation-phases)

## 🎯 Overview

This application is a personal accountability tool designed to help users quit smoking by implementing time-based restrictions, tracking progress, and preventing self-sabotage through anti-cheat mechanisms. The app uses a "lockdown period" system where users must wait a specified duration before they can smoke again, with consequences for breaking the rules.

### Key Principles

1. **Self-Accountability**: Users hold themselves accountable by logging their actions
2. **Time-Based Restrictions**: Lockdown periods prevent immediate relapse
3. **Progress Tracking**: Visual feedback on time saved and progress made
4. **Anti-Cheat Protection**: Server-side validation prevents time manipulation
5. **Reflection & Learning**: Periodic questions help users understand their patterns

## 🎯 Problem Statement

Quitting smoking is challenging because:
- Immediate gratification often overrides long-term goals
- Lack of accountability makes it easy to relapse
- No consequences for breaking commitments
- Difficulty tracking progress and time saved
- Easy to cheat by manipulating device time

## 💡 Solution Overview

A full-stack application that:
- Enforces time-based restrictions (lockdown periods)
- Tracks progress and time saved
- Prevents cheating through server-side time validation
- Provides reflection prompts to understand behavior patterns
- Saves all activity automatically for accountability

## 🔧 Core Features

### 1. Main Dashboard
- **Blocked State**: Shows remaining lockdown time with countdown
- **Active State**: Shows time ahead of plan and progress metrics
- **Action Buttons**: 
  - "I cheated and dishonored myself" (when blocked)
  - "I'm choosing to harm myself" (when active)

### 2. Settings
- Simple minutes input for lockdown period configuration
- Separate from session data (persistent settings)

### 3. Auto-Save
- Automatic check-in tracking
- Session persistence across app opens
- Activity logging for all user actions

### 4. Anti-Cheat Security
- Server-side time validation
- Timezone detection and validation
- Device time manipulation detection
- NTP (Network Time Protocol) synchronization checks

### 5. Reflection System
- Periodic questions about progress
- Behavioral pattern analysis
- Motivational feedback

## 🛠️ Technical Requirements

### Frontend (Next.js)
- **Framework**: Next.js 15 with App Router
- **State Management**: React Server Components + Client Components
- **Real-time Updates**: Server-side rendering with client-side hydration
- **Offline Support**: Service Worker for offline capability
- **PWA**: Progressive Web App for mobile-like experience

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL for persistent storage
- **Authentication**: Session-based (single-user app)
- **Time Validation**: NTP synchronization + server timestamps
- **API**: RESTful endpoints with proper error handling

### Security Requirements
- Server-side time validation on all time-sensitive operations
- Timezone offset tracking and validation
- Device fingerprinting for session security
- Rate limiting on critical endpoints
- Input validation and sanitization

## 🔒 Security Considerations

### Anti-Cheat Mechanisms

1. **Server Time Authority**
   - All time calculations performed server-side
   - Client timestamps validated against server time
   - NTP synchronization for accurate server time

2. **Timezone Validation**
   - Track user timezone on each request
   - Detect sudden timezone changes
   - Flag suspicious timezone shifts

3. **Device Time Detection**
   - Compare client-reported time with server time
   - Detect backward time jumps
   - Detect forward time jumps beyond reasonable limits

4. **Session Integrity**
   - Server-side session management
   - Activity logging with server timestamps
   - Audit trail for all actions

5. **Request Validation**
   - Validate all time-sensitive requests
   - Check for time manipulation patterns
   - Rate limiting on critical actions

## 📖 User Stories

### Story 1: Blocked State
**As a user**, when I open the main page and I'm still in a lockdown period, I see:
- A countdown showing remaining time (XX:XX format)
- A button labeled "I cheated and dishonored myself"
- When clicked, the action is logged but consequences are delayed

### Story 2: Active State
**As a user**, when I open the main page after the lockdown period ends, I see:
- The amount of time I'm ahead of my plan
- Progress metrics and statistics
- A button labeled "I'm choosing to harm myself"
- When clicked, a new lockdown period begins

### Story 3: Settings
**As a user**, I can click a settings icon to:
- Enter a simple number (minutes) for the lockdown period
- Save my preference (separate from session data)
- See my current settings

### Story 4: Auto-Save
**As a user**, when I interact with the app:
- All check-ins are automatically saved
- My active session persists across app opens
- All activities are logged without manual intervention

### Story 5: Anti-Cheat
**As a user**, I cannot cheat by:
- Changing my device time (server validates)
- Changing my timezone (server detects)
- Manipulating client-side timestamps (server is authoritative)

### Story 6: Reflection
**As a user**, periodically I'm asked:
- "What have you done?" - to reflect on progress
- "When?" - to understand timing patterns
- Other reflection questions to build awareness

## 📊 Success Metrics

### User Engagement
- Daily active users
- Check-in frequency
- Session duration
- Feature usage patterns

### Effectiveness
- Average time between relapses
- Lockdown period completion rate
- Progress over time (time saved)
- Reflection question responses

### Technical
- API response times
- Error rates
- Security event detection
- Data persistence reliability

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Database schema design and setup
- [ ] NestJS API structure with basic endpoints
- [ ] Next.js app structure with routing
- [ ] Authentication/session management
- [ ] Basic UI components

### Phase 2: Core Features (Week 3-4)
- [ ] Lockdown period logic (server-side)
- [ ] Main dashboard with blocked/active states
- [ ] Settings page with lockdown period configuration
- [ ] Auto-save functionality
- [ ] Basic time tracking

### Phase 3: Security & Anti-Cheat (Week 5-6)
- [ ] Server-side time validation
- [ ] Timezone detection and validation
- [ ] Device time manipulation detection
- [ ] NTP synchronization
- [ ] Security logging and monitoring

### Phase 4: Reflection System (Week 7)
- [ ] Periodic question system
- [ ] Reflection question database
- [ ] Response tracking and analysis
- [ ] UI for reflection prompts

### Phase 5: Polish & Enhancement (Week 8)
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Testing and bug fixes
- [ ] Documentation

## 🔗 Related Documentation

- [UX Guidelines](./QUIT_SMOKING_UX.md)
- [Database & API Design](./QUIT_SMOKING_DATABASE_API.md)
- [Frontend Structure](./QUIT_SMOKING_FRONTEND.md)
- [Design System Prompt](./QUIT_SMOKING_DESIGN_SYSTEM.md)

---

**Next Steps**: Review UX guidelines and technical architecture documents before beginning implementation.
