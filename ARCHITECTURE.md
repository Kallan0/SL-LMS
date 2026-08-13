# Sign Language LMS - Architecture Documentation

## Overview

This is a fully functional, responsive frontend for a Sign Language Learning Management System (LMS) built with React, TypeScript, Tailwind CSS, React Query, and Framer Motion.

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Routing**: Wouter (lightweight routing)
- **State Management**: Custom hooks + React Context
- **Data Fetching**: Custom useQuery/useMutation hooks (lightweight React Query alternative)
- **Animations**: Framer Motion
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## Project Structure

```
client/
├── public/                 # Static files (favicon, robots.txt, manifest.json)
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Navigation.tsx         # Main navigation bar
│   │   ├── AppLayout.tsx          # Layout wrapper for authenticated pages
│   │   ├── ProtectedRoute.tsx      # Route protection component
│   │   ├── ErrorBanner.tsx        # Error display component
│   │   ├── ErrorBoundary.tsx      # Error boundary wrapper
│   │   └── ProgressTracker.tsx    # Progress statistics component
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx        # Authentication state management
│   │   └── ThemeContext.tsx       # Theme management
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts             # JWT token management
│   │   ├── useInactivityLogout.ts # Inactivity logout (10 minutes)
│   │   ├── useQuery.ts            # Data fetching with caching
│   │   └── useMobile.tsx          # Mobile breakpoint detection
│   ├── pages/             # Page components
│   │   ├── Login.tsx              # Login page
│   │   ├── Dashboard.tsx          # Main dashboard
│   │   ├── Lessons.tsx            # Browse lessons
│   │   ├── LessonDetail.tsx       # Detailed lesson view
│   │   ├── Quiz.tsx               # Quiz interface
│   │   ├── Leaderboard.tsx        # User rankings
│   │   ├── Profile.tsx            # User profile
│   │   └── NotFound.tsx           # 404 page
│   ├── services/          # API service layer
│   │   ├── api.ts                 # Main API service
│   │   └── mockData.ts            # Mock data for development
│   ├── types/             # TypeScript interfaces
│   │   └── index.ts               # All type definitions
│   ├── lib/               # Utility functions
│   │   └── utils.ts               # Helper functions
│   ├── App.tsx            # Main app component with routing
│   ├── main.tsx           # React entry point
│   └── index.css          # Global styles and Tailwind config
├── index.html             # HTML template
└── package.json           # Dependencies
```

## Key Features

### 1. Authentication & Security

- **JWT-based authentication** with secure token storage in localStorage
- **useAuth hook** for token management and expiration tracking
- **useInactivityLogout hook** that automatically logs out users after 10 minutes of inactivity
- **ProtectedRoute component** for route protection
- **ErrorBanner component** for inline error display (no browser alerts)

### 2. Data Fetching & Caching

- **Custom useQuery hook** with built-in caching and stale time management
- **Custom useMutation hook** for data mutations
- **Service layer pattern** for easy API endpoint swapping
- **Mock data service** for development and testing

### 3. Responsive Design

- **Mobile-first approach** using Tailwind CSS
- **Responsive grid layouts** for all pages
- **Mobile navigation** with hamburger menu
- **Sticky navigation bar** for easy access
- **Tested on mobile, tablet, and desktop** viewports

### 4. Animations & UX

- **Framer Motion animations** for smooth page transitions
- **Staggered animations** for list items
- **Hover effects** on interactive elements
- **Loading states** with spinners
- **Progress bars** with animated fills
- **Smooth color transitions** and scale effects

### 5. Error Handling

- **Try/catch blocks** in all async operations
- **console.error()** logging for debugging
- **ErrorBanner component** for user-friendly error display
- **Error boundaries** for React error handling
- **Graceful fallbacks** for failed data fetches

## Authentication Flow

1. User navigates to `/login`
2. Enters email and password
3. Login page validates input and calls `apiService.login()`
4. Mock service returns user data and JWT token
5. Token stored in localStorage via `useAuth` hook
6. User redirected to `/dashboard`
7. ProtectedRoute checks authentication before rendering
8. Navigation component shows user info and logout button
9. useInactivityLogout hook monitors activity
10. After 10 minutes of inactivity, user is logged out automatically

## Data Flow

1. Pages use `useQuery` hook to fetch data
2. `useQuery` calls service layer function
3. Service layer calls `apiService` methods
4. `apiService` uses mock data service in development
5. Data is cached based on `staleTime` setting
6. Components re-render when data changes
7. Loading and error states are handled gracefully

## API Service Layer

The service layer (`/client/src/services/api.ts`) provides:

```typescript
// Authentication
login(email: string, password: string): Promise<LoginResponse>
logout(): Promise<void>

// Lessons
getLessons(): Promise<Lesson[]>
getLesson(id: string): Promise<Lesson>
getQuizQuestions(lessonId: string): Promise<QuizQuestion[]>

// Progress
getProgress(): Promise<Progress[]>
getLessonProgress(lessonId: string): Promise<Progress>
updateProgress(lessonId: string, status: ProgressStatus, accuracy: number): Promise<Progress>

// Leaderboard
getLeaderboard(): Promise<LeaderboardEntry[]>

// Achievements
getAchievements(): Promise<Achievement[]>

// Quiz
submitQuiz(lessonId: string, answers: Record<string, string>): Promise<QuizResult>
```

## TypeScript Interfaces

All types are defined in `/client/src/types/index.ts`:

- **User**: User profile with role, XP, streaks
- **Lesson**: Lesson content with steps and exercises
- **Progress**: User progress on lessons
- **QuizQuestion**: Quiz questions with options
- **LeaderboardEntry**: User ranking data
- **Achievement**: Achievement badges
- **ErrorResponse**: Error handling

## Styling System

- **Tailwind CSS 4** with custom theme
- **Dark theme** optimized for learning
- **Color palette**: Indigo, purple, slate, with accent colors
- **Typography**: Professional fonts with clear hierarchy
- **Spacing**: Consistent spacing scale
- **Responsive breakpoints**: Mobile, tablet, desktop

## Performance Optimizations

- **Code splitting** via Vite
- **Lazy loading** of routes
- **Image optimization** (using URLs instead of local files)
- **Caching** with custom useQuery hook
- **Memoization** of expensive computations
- **Event throttling** for inactivity tracking
- **Optimized animations** using GPU-accelerated transforms

## Security Considerations

- **JWT tokens** stored in localStorage (consider httpOnly cookies for production)
- **No hardcoded secrets** in code (use .env file)
- **CORS headers** handled by backend
- **Input validation** on login form
- **Error messages** don't expose sensitive information
- **Inactivity logout** for session security

## Development Workflow

1. **Start dev server**: `pnpm run dev`
2. **Type checking**: `pnpm run check`
3. **Code formatting**: `pnpm run format`
4. **Build for production**: `pnpm run build`
5. **Preview build**: `pnpm run preview`

## Swapping Mock Data for Real API

To use real API endpoints instead of mock data:

1. Update `/client/src/services/api.ts`
2. Replace `MockApiService` with actual HTTP calls using `axios` or `fetch`
3. Update environment variables in `.env`
4. No changes needed in components - they use the same interface

Example:
```typescript
// Before (mock)
export const apiService = new MockApiService();

// After (real API)
export const apiService = new ProductionApiService(
  process.env.VITE_API_URL || 'https://api.example.com'
);
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

- Mock data service doesn't persist between page refreshes
- Quiz results are not saved to backend
- Profile edits are not persisted
- No real video playback (placeholder only)
- No real-time features (WebSocket)

## Future Enhancements

- Real API integration
- WebSocket for real-time updates
- Video streaming for lessons
- Advanced analytics
- Social features (comments, sharing)
- Offline support with service workers
- Progressive Web App (PWA) features
- Advanced quiz types (drag-and-drop, matching)
- Gamification features (badges, rewards)
- Accessibility improvements (WCAG 2.1 AA)

## Troubleshooting

### Inactivity logout not working
- Check that `useInactivityLogout` hook is called in AppLayout
- Verify localStorage is not disabled
- Check browser console for errors

### Data not updating
- Clear browser cache and localStorage
- Check network tab for API calls
- Verify mock data service is returning correct data
- Check staleTime settings in useQuery

### Styling issues
- Ensure Tailwind CSS is properly configured
- Check that global styles are imported in index.css
- Verify theme variables are set in index.css

## Support

For issues or questions, refer to the component documentation and inline comments throughout the codebase.
