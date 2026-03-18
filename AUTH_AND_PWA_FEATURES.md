# BibleCraft: Authentication, PWA & COPPA Compliance

## Overview
This document describes the three major features added to BibleCraft: Player Authentication, PWA Conversion, and COPPA Compliance.

---

## 1. Player Authentication (COPPA-Compliant Anonymous Auth)

### Files Created/Modified
- `src/lib/auth.ts` - Core authentication functions
- `src/lib/safe-names.ts` - Safe name generation and validation
- `src/App.tsx` - Auth flow components and state management
- `supabase/migrations/003_coppa_compliance.sql` - Database schema

### Features

#### Anonymous Sign-In
- Uses Supabase Anonymous Auth (no email/password required)
- Creates session automatically without collecting PII
- Complies with COPPA by not storing personally identifiable information

```typescript
await signInAnonymously(); // Creates anonymous session
```

#### Parent Gate
- Math problem displayed before gameplay (prevents accidental kids-only access)
- Changes each time parent gate is shown
- Stored in localStorage so parents don't have to repeat it each session
- Simple UI: "What is 7 × 4?" with answer input

#### Campus Selection
- Kids choose which campus/church location they attend
- Fetches from Supabase `campuses` table
- Used for campus-specific leaderboards and content

#### Safe Display Names
- Pre-generated combinations of: Virtue (Brave, Joyful, etc.) + Biblical Character (David, Moses, etc.) + Number (1-99)
- Examples: "BraveElijah42", "JoyfulRuth7"
- Blocklist validation prevents inappropriate names
- Prevents free-text input that could expose PII

#### Player Profile Creation
```typescript
await createPlayerProfile(displayName, avatarId, campusId);
```
- Creates player record linked to anonymous auth user
- Stores only: display_name, avatar_id, campus_id, timestamps
- No email, real name, phone, location, or personal information

### Auth Flow
1. **First Load**: Parent Gate → Campus Select → Name Picker → Game
2. **Returning Players**: Skips auth and goes straight to title screen
3. **State Management**: `authStage` in App component tracks: "check" → "gate" → "campus" → "name" → "ready"

### Database Schema Updates (Migration 003)
```sql
ALTER TABLE players
ADD COLUMN parent_consent_at TIMESTAMP WITH TIME ZONE;
ADD COLUMN is_anonymous BOOLEAN DEFAULT TRUE;
```

---

## 2. PWA Conversion

### Files Created
- `public/manifest.json` - PWA manifest with metadata
- `public/sw.js` - Service Worker with caching strategies
- `public/icon.svg` - Minecraft-themed pickaxe icon
- `index.html` - Updated with PWA meta tags

### Features

#### Web App Manifest (`manifest.json`)
- Name: "BibleCraft"
- Display: "standalone" (full-screen app experience)
- Theme Color: Green (#4ade80)
- Background: Brown (#3b2507)
- Icons: 192x192 and 512x512 (both standard and maskable variants)
- Categories: games, education
- Shortcuts for quick game launch

#### Service Worker (`sw.js`)
Two-strategy approach:

1. **Cache-First** (Static Assets)
   - CSS, JS, fonts, images
   - Optimal for offline gameplay
   - Automatic fallback when network fails

2. **Network-First** (API Calls)
   - Supabase API requests
   - Tries network first, falls back to cache
   - Ensures fresh data when online

#### Meta Tags in `index.html`
```html
<meta name="theme-color" content="#4ade80" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="BibleCraft" />
```

#### Installability
- Users can "Install" BibleCraft on their home screen
- iOS: "Add to Home Screen" in Safari
- Android: "Install App" in Chrome
- Works offline for all cached content

---

## 3. COPPA Compliance

### Key Principles
1. **No PII Collection**: No email, name, phone, location, photos
2. **Parent Gate**: Math problem before gameplay
3. **Safe Names Only**: Pre-generated, blocklist-validated
4. **No Tracking**: No analytics, no behavioral profiling
5. **No Ads**: No third-party tracking or behavioral advertising
6. **Privacy Notice**: In-game notice explaining data practices

### Privacy Notice Component
- Location: `src/components/PrivacyNotice.tsx`
- Accessible from game settings
- Explains what data is collected and how it's used
- Lists prohibited practices

### No Prohibited Practices
- ✗ Third-party trackers (Google Analytics, etc.)
- ✗ Behavioral advertising
- ✗ Data selling
- ✗ Cross-site tracking
- ✗ Video/photo collection
- ✗ Free-text chat between players

### Safe Name Generation
```typescript
import { generateSafeName, isNameSafe } from './lib/safe-names';

// Generate random safe name
const name = generateSafeName(); // "BraveJoseph23"

// Validate custom name
if (isNameSafe(userInput)) {
  // Safe to use
} else {
  // Blocked by blocklist
}
```

### Database Safety
- `players` table fields:
  - `id` (auth user ID)
  - `display_name` (safe only)
  - `avatar_id` (emoji/number)
  - `campus_id` (for leaderboards)
  - `is_anonymous` (always TRUE)
  - `parent_consent_at` (timestamp)
  - NO: email, real_name, phone, location, photos

### Compliance Checklist
- [x] Parent gate (math problem)
- [x] No PII collection
- [x] Safe name generation
- [x] Privacy notice
- [x] No third-party trackers
- [x] No behavioral ads
- [x] Anonymous auth
- [x] No cross-session tracking
- [x] Campus-only leaderboards

---

## Testing

### Parent Gate
1. Open app in browser
2. You should see "Parent Gate" screen with math problem
3. Enter incorrect answer → error message
4. Enter correct answer → proceeds to campus select
5. Refresh page → should skip gate (stored in localStorage)

### Campus Select
1. After parent gate, shows list of campuses from Supabase
2. Click a campus to continue

### Name Picker
1. Shows 5 suggested safe names
2. Click suggestion or type custom name (validated)
3. Click "Start Adventure" → creates anonymous auth + player profile

### PWA Installation
- **Desktop Chrome**: Address bar → Install app
- **Android Chrome**: Menu → Install app
- **iOS Safari**: Share → Add to Home Screen
- Works offline with cached assets

### Service Worker
1. Open DevTools → Application → Service Workers
2. Should show `/sw.js` as "activated and running"
3. Go offline, app still works for cached content

---

## Build & Deploy

### Build
```bash
npm run build
```
- TypeScript type checking: `tsc -b`
- Vite production build: `vite build`
- Output: `dist/` directory

### Files Included
- `dist/index.html` - Updated with PWA meta tags
- `dist/manifest.json` - PWA manifest (auto-copied by Vite)
- `dist/sw.js` - Service Worker (auto-copied)
- `dist/icon.svg` - PWA icon (auto-copied)

### Deployment Notes
- Service Worker must be served from root (`/sw.js`)
- HTTPS required for PWA installability
- Icons should be in `public/` for Vite to copy

---

## Architecture

### Auth State Flow
```
App Component
  ├── authStage: "check" | "gate" | "campus" | "name" | "ready"
  ├── selectedCampus: string
  └── Game Screens (only shown when authStage === "ready")
```

### Auth Functions
```typescript
signInAnonymously()           // Creates session
createPlayerProfile(...)      // Stores safe name + campus
getPlayerProfile()            // Retrieves player data
isAuthenticated()             // Checks session status
useAuth()                      // React hook for auth state
```

### Safe Names
```typescript
generateSafeName()            // Random safe name
generateSafeNameSuggestions() // Array of suggestions
isNameSafe(name)              // Validate custom name
```

---

## Known Limitations

1. **Icon Generation**: Currently using SVG placeholder. For production, generate PNG icons using a graphics library
2. **Offline Sync**: Service Worker caches data but doesn't sync progress when coming online (placeholder for future)
3. **Push Notifications**: Service Worker has placeholder for push notifications
4. **Single Campus**: Player picks one campus; would need UI enhancement for campus switching

---

## Future Enhancements

1. Generate actual PNG icons using `sharp` or `canvas`
2. Implement background sync for offline progress
3. Add push notifications for reminders
4. Multi-campus support per player
5. Parent email verification (optional)
6. Age gate (optional)

---

## Questions?

- Authentication: See `src/lib/auth.ts`
- Safe names: See `src/lib/safe-names.ts`
- PWA config: See `public/manifest.json` and `public/sw.js`
- COPPA compliance: See `src/components/PrivacyNotice.tsx` and migration `003`
