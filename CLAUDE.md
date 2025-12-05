# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RecycleMaster is a React-based control interface for a 3D printing filament recycling machine. It uses the Google Gemini AI API to provide intelligent material analysis and a live audio chat assistant for user support.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build
```

## Environment Setup

Set `GEMINI_API_KEY` in `.env.local` for the Google Gemini AI integration.

## Architecture

### Entry Points
- `index.tsx` - React root with provider hierarchy: `ThemeProvider > LanguageProvider > App`
- `App.tsx` - Main app with page routing and `AppContext` for device settings

### Core Structure
```
/
├── components/
│   ├── pages/           # Page components (ManageDevice, AiAssistant, Profile)
│   ├── ai/              # AI components (DeviceControlAI, SupportChatbot)
│   └── *.tsx            # Shared UI (BottomNav, ControlSlider, ThemeToggle, etc.)
├── contexts/            # React contexts (ThemeContext, LanguageContext)
├── services/            # API services (geminiService.ts)
├── utils/               # Utilities (themeConfig.ts, audioUtils.ts)
└── types.ts             # TypeScript types and enums
```

### Key Patterns

**State Management**: Uses React Context for global state:
- `ThemeContext` - Light/dark mode with localStorage persistence
- `LanguageContext` - English/Arabic translations with RTL support
- `AppContext` - Device settings (temperature, speeds, operation states)

**Gemini AI Integration** (`services/geminiService.ts`):
- `getDeviceSettingsForMaterial()` - Analyzes material (text/image) and returns optimal machine settings using structured JSON output
- `LiveChatSession` - WebSocket-based live audio chat using Gemini's native audio model with PCM audio streaming

**Theming** (`utils/themeConfig.ts`): Centralized Tailwind class mappings for dark/light modes via `getThemeClasses(theme)`.

**i18n**: `useLanguage()` hook provides `t()` function for translations and `isRTL` flag for layout direction.

### Page Navigation
Uses `Page` enum from `types.ts` - navigation state managed in `App.tsx`, rendered via `BottomNav`.

## Tech Stack
- React 19 with TypeScript
- Vite for bundling
- Tailwind CSS (via CDN in index.html)
- @google/genai for Gemini API
- Web Audio API for live audio processing
