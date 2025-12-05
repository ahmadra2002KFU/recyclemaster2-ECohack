# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RecycleMaster is a React-based control interface for a 3D printing filament recycling machine. It uses Google Gemini AI for intelligent material analysis and live audio chat assistance. The app features real-time device monitoring, historical analytics with SQLite storage, and supports both web and mobile (Android/iOS) platforms via Capacitor.

## Development Commands

```bash
npm install              # Install dependencies
npm run dev              # Start Vite dev server (default port 5173)
npm run build            # Build for production
npm run preview          # Preview production build

# Mobile (Capacitor)
npm run cap:sync         # Sync web assets to native platforms
npm run cap:android      # Open Android project in Android Studio
npm run build:android    # Build and sync to Android
npm run generate-icons   # Generate app icons from source
```

## Environment Setup

Set `GEMINI_API_KEY` in `.env.local` for Google Gemini AI integration. The app will throw errors if this is not configured.

## Architecture

### Provider Hierarchy
React Context providers wrap the app in `index.tsx`:
```
ThemeProvider > LanguageProvider > DataProvider > App
```

### Key Contexts

**ThemeContext** - Light/dark mode with localStorage persistence
- `useTheme()` provides `theme` and `toggleTheme()`
- Theme classes centralized in `utils/themeConfig.ts`

**LanguageContext** - English/Arabic with full RTL layout support
- `useLanguage()` provides `t()` translation function, `language`, and `isRTL` flag
- All UI text must use `t()` with translation keys

**DataContext** (`contexts/DataContext.tsx`) - Real-time device metrics and historical data
- `deviceState`: Live simulated readings (diameter, power usage, recording status)
- `updateDeviceState()`: Called by App when settings/device state changes
- `getAnalyticsData()`: Query historical data by time range
- Manages automatic recording intervals (5s save, 1s simulation)
- Initializes SQLite database and generates mock data if empty

**AppContext** - Device control settings (created in `App.tsx`)
- `deviceSettings`: temperature, speeds, target diameter, operation states
- `isDeviceOn`: Master device power state

### Data Flow Pattern

1. User adjusts controls → `setDeviceSettings()` in AppContext
2. App.tsx `useEffect` calls `DataContext.updateDeviceState()`
3. DataContext starts/stops simulation and recording intervals
4. Simulated readings saved to SQLite every 5 seconds
5. Analytics page queries historical data via `getAnalyticsData()`

### Database Architecture (`services/databaseService.ts`)

Platform-aware SQLite implementation:
- **Native (Android/iOS)**: Uses `@capacitor-community/sqlite` with native file storage
- **Web**: Uses `sql.js` with localStorage persistence (base64-encoded)

Schema: Single `readings` table with indexed timestamp for efficient time-range queries.

Key functions:
- `initDatabase()` - Lazy initialization with platform detection
- `saveReading()` / `saveReadings()` - Single/batch inserts
- `getReadings(startTime, endTime)` - Range queries for analytics
- `persistDatabase()` - Web-only localStorage sync
- `deleteOldReadings(days)` - Automatic cleanup (default 7 days)

Data persists every 10 readings on web, auto-persists on native.

### Gemini AI Integration (`services/geminiService.ts`)

**Material Analysis**:
- `getDeviceSettingsForMaterial(prompt, imageBase64?)`
- Uses `gemini-2.5-flash` with structured JSON output schema
- Returns optimal settings: `{temperature, extrusionSpeed, shredderSpeed, pullingSpeed}`
- Supports both text descriptions and image analysis

**Live Audio Chat**:
- `LiveChatSession` class manages WebSocket connection
- Uses `gemini-2.5-flash-native-audio-preview` model
- Bidirectional PCM audio streaming (16kHz input, 24kHz output)
- Audio processing via Web Audio API (ScriptProcessor for input, AudioBuffer for output)
- Handles interruption and audio queue management

Audio notes:
- Input: Microphone → ScriptProcessor → PCM encoding → Gemini
- Output: Gemini → Base64 decode → AudioBuffer → Web Audio playback
- Uses vendor-prefixed `webkitAudioContext` for Safari compatibility

### Page Structure

Four main pages (routed via `Page` enum in App.tsx):

1. **ManageDevice** - Real-time device control (sliders, toggles, live metrics)
2. **AiAssistant** - Two AI modes: DeviceControlAI (material analysis) and SupportChatbot (live audio)
3. **Analytics** - Time-series charts (diameter/temp, diameter/speed, power usage) with date range selector
4. **Profile** - User stats, language selector, theme toggle

### Styling & Theming

- Tailwind CSS loaded via CDN in `index.html` (no build-time processing)
- All components use `getThemeClasses(theme)` for consistent colors
- RTL support via `dir={isRTL ? 'rtl' : 'ltr'}` and Tailwind's `space-x-reverse` utility
- Theme colors defined in light/dark palettes with WCAG AA contrast ratios

### Mobile (Capacitor)

- `capacitor.config.ts` defines app ID, web directory, and SQLite plugin settings
- SQLite configuration: no encryption, platform-specific storage locations
- Android scheme: HTTPS for secure context (required for Web Audio API)
- Build output: `dist/` directory synced to native platforms

## Tech Stack

- React 19 with TypeScript
- Vite for bundling and dev server
- Tailwind CSS (CDN)
- Capacitor 7 for native mobile support
- SQLite: `@capacitor-community/sqlite` (native), `sql.js` (web)
- Google Gemini API: `@google/genai`
- Recharts for analytics visualizations
- Web Audio API for live audio processing

## Development Notes

- API key must be set in `.env.local` as `GEMINI_API_KEY`
- Database auto-initializes on first load, generates 24h mock data if empty
- All device metrics are simulated via `utils/dataSimulator.ts`
- Audio chat requires HTTPS or localhost (secure context for microphone access)
- SQLite data persists in localStorage (web) or native storage (mobile)
