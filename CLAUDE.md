# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build production application  
- `npm start` - Start production server

## Architecture Overview

### Authentication Flow
The app uses a dual authentication system:
- **NextAuth.js** (`src/pages/api/auth/[...nextauth].js`) - Handles Google OAuth signin/signout
- **AuthContext** (`src/context/AuthContext.js`) - React context providing `useAuth()` hook with `user`, `isAuthenticated`, and `loading` state
- Authentication state flows: NextAuth session → AuthContext → components

### File Upload & Storage
- **Frontend**: `src/components/FileDropzone.js` handles drag-drop file uploads
- **API**: `src/pages/api/upload.js` processes uploads using formidable + AWS S3
- **AWS Integration**: `src/lib/aws.js` provides S3 utilities (upload, list, delete, signed URLs)
- **Storage Pattern**: Files stored as `users/{userId}/bills/{utilityType}/{filename}` in S3

### Data Architecture
- **Mock Data**: `src/services/utilityData.js` generates realistic utility bill data with seasonal variations
- **State Management**: React useState/useEffect patterns, no external state library
- **File Structure**: 
  - `/pages` - Next.js file-based routing
  - `/components` - Reusable React components 
  - `/lib` - External service integrations (AWS, Firebase)
  - `/context` - React context providers
  - `/services` - Business logic and data utilities

### Key Components
- `UtilityComparisonForm` - Main comparison interface on homepage
- `BillHistoryChart` - Chart.js integration showing spending over time
- `Dashboard` - Protected route showing user bills and analysis
- `RequireAuth` - Auth wrapper component for protected routes

### Environment Variables Required
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN  
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET
NEXT_PUBLIC_AWS_ACCESS_KEY_ID
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
NEXT_PUBLIC_AWS_REGION
NEXT_PUBLIC_AWS_S3_BUCKET
```

## Key Patterns

### Protected Routes
```javascript
const { user, isAuthenticated, loading } = useAuth();
if (!loading && !isAuthenticated) {
  router.push('/auth/signin');
}
```

### File Upload Flow
1. FileDropzone component captures files
2. Sends to `/api/upload` with userId and utilityType
3. API uploads to S3 with organized folder structure
4. Returns S3 URL and key for storage/reference

### Styling
- CSS Modules for component-scoped styles
- File naming: `ComponentName.module.css`
- Global styles in `src/styles/globals.css`