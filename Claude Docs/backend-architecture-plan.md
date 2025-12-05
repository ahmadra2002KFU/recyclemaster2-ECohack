# RecycleMaster Backend Architecture Plan

## Document Version: 1.0
## Date: 2025-12-05

---

## Executive Summary

This document outlines the recommended backend architecture for RecycleMaster's data persistence layer. After analyzing the current codebase (React 19 + Vite, client-side only) and evaluating multiple persistence options, **Dexie.js with IndexedDB** is the recommended solution for this browser-based application.

---

## 1. Current State Analysis

### Existing Architecture
```
recyclemaster/
├── App.tsx                 # Main app with DeviceSettings in React state
├── types.ts                # DeviceSettings interface
├── contexts/
│   ├── ThemeContext.tsx    # localStorage: theme
│   └── LanguageContext.tsx # localStorage: language
├── services/
│   └── geminiService.ts    # Google Gemini AI integration
└── components/
    └── pages/
        └── ManageDevicePage.tsx  # Device control UI
```

### Current Data Flow
- **DeviceSettings**: React state only (lost on refresh)
- **Theme**: localStorage (`theme` key)
- **Language**: localStorage (`language` key)
- **User Name**: localStorage (inferred from ProfilePage)

### Current DeviceSettings Interface
```typescript
interface DeviceSettings {
  temperature: number;        // 30-250 C
  extrusionSpeed: number;     // 0-100%
  shredderSpeed: number;      // 0-100%
  pullingSpeed: number;       // 0-100%
  isShredding: boolean;
  isMelting: boolean;
  isExtruding: boolean;
}
```

### Missing Data Points (to be added)
- Fan speed
- Diameter
- Power usage
- Timestamps for time-series

---

## 2. Persistence Approach Evaluation

### Option A: sql.js (SQLite via WASM) - NOT RECOMMENDED
**Pros:**
- Full SQL capabilities
- Familiar relational model
- Good for complex queries

**Cons:**
- Requires manual persistence to localStorage/IndexedDB
- Large WASM bundle (~1MB)
- No automatic reactivity
- Complex setup for persistence
- Binary data stored as strings in localStorage (size limits)

### Option B: IndexedDB with Dexie.js - RECOMMENDED
**Pros:**
- Native browser storage (no WASM overhead)
- Automatic persistence
- Larger storage limits (typically 50%+ of disk)
- Built-in indexing for time-series queries
- Reactive queries with `liveQuery()`
- TypeScript support
- Simple API
- Active maintenance, high reputation

**Cons:**
- NoSQL (but Dexie makes it feel like SQL)
- Browser-only (no server sync without Dexie Cloud)

### Option C: Lightweight Node.js Backend - OVERKILL
**Pros:**
- True SQLite with better-sqlite3
- Server-side processing
- Multi-device sync potential

**Cons:**
- Requires server deployment
- Adds complexity for a client-side app
- Unnecessary for single-user browser app

### Decision: Dexie.js with IndexedDB

**Rationale:**
1. RecycleMaster is a browser-based application (not Electron)
2. Single-user, single-device use case
3. Time-series data needs efficient indexing (Dexie excels here)
4. No WASM overhead
5. Native browser API with excellent wrapper
6. Reactive queries integrate well with React

---

## 3. Database Schema Design

### 3.1 Conceptual Data Model

```
+-------------------+     +--------------------+     +-------------------+
|   UserProfile     |     |  DeviceSession     |     |  DeviceReading    |
+-------------------+     +--------------------+     +-------------------+
| id (PK)           |     | id (PK)            |     | id (PK)           |
| name              |----<| startTime          |----<| sessionId (FK)    |
| createdAt         |     | endTime            |     | timestamp         |
| preferences       |     | materialType       |     | temperature       |
+-------------------+     | aiRecommendation   |     | fanSpeed          |
                          +--------------------+     | diameter          |
                                                     | extrusionSpeed    |
+-------------------+                                | shredderSpeed     |
| DeviceSettings    |                                | pullingSpeed      |
+-------------------+                                | powerUsage        |
| id (PK)           |                                | isShredding       |
| key               |                                | isMelting         |
| value             |                                | isExtruding       |
| updatedAt         |                                +-------------------+
+-------------------+
```

### 3.2 Dexie Schema Definition

```typescript
// src/db/database.ts
import Dexie, { type EntityTable } from 'dexie';

// ============ INTERFACES ============

export interface UserProfile {
  id?: number;
  name: string;
  createdAt: Date;
  totalMaterialRecycled: number;  // kg
  totalHoursActive: number;
}

export interface DeviceSession {
  id?: number;
  startTime: Date;
  endTime?: Date;
  materialType?: string;          // e.g., "PLA", "HDPE", "PET"
  aiRecommendation?: {
    temperature: number;
    extrusionSpeed: number;
    shredderSpeed: number;
    pullingSpeed: number;
  };
  notes?: string;
}

export interface DeviceReading {
  id?: number;
  sessionId: number;              // Foreign key to DeviceSession
  timestamp: Date;

  // Metrics
  temperature: number;            // Celsius (30-250)
  fanSpeed: number;               // Percentage (0-100)
  diameter: number;               // mm (typically 1.75 or 2.85)
  extrusionSpeed: number;         // Percentage (0-100)
  shredderSpeed: number;          // Percentage (0-100)
  pullingSpeed: number;           // Percentage (0-100)
  powerUsage: number;             // Watts

  // Status flags
  isShredding: boolean;
  isMelting: boolean;
  isExtruding: boolean;
}

export interface AppSetting {
  key: string;                    // Primary key
  value: any;
  updatedAt: Date;
}

// ============ DATABASE CLASS ============

export class RecycleMasterDB extends Dexie {
  userProfile!: EntityTable<UserProfile, 'id'>;
  sessions!: EntityTable<DeviceSession, 'id'>;
  readings!: EntityTable<DeviceReading, 'id'>;
  settings!: EntityTable<AppSetting, 'key'>;

  constructor() {
    super('RecycleMasterDB');

    this.version(1).stores({
      // UserProfile: auto-increment id
      userProfile: '++id, createdAt',

      // DeviceSession: auto-increment id, indexed by time
      sessions: '++id, startTime, endTime, materialType',

      // DeviceReading: auto-increment id, compound index for time-series queries
      // Index on [sessionId+timestamp] for efficient session-based time queries
      readings: '++id, sessionId, timestamp, [sessionId+timestamp]',

      // AppSetting: key is primary key
      settings: 'key, updatedAt'
    });
  }
}

// Singleton instance
export const db = new RecycleMasterDB();
```

### 3.3 Index Strategy

| Table | Index | Purpose |
|-------|-------|---------|
| `readings` | `sessionId` | Filter readings by session |
| `readings` | `timestamp` | Query by time range |
| `readings` | `[sessionId+timestamp]` | Compound index for session time-series |
| `sessions` | `startTime` | Sort/filter sessions chronologically |
| `sessions` | `materialType` | Filter by material |
| `settings` | `key` (PK) | Direct key-value lookup |

---

## 4. Data Access Layer Design

### 4.1 Repository Pattern

```typescript
// src/db/repositories/ReadingsRepository.ts
import { db, DeviceReading } from '../database';
import { liveQuery } from 'dexie';

export class ReadingsRepository {

  // Create a new reading
  async add(reading: Omit<DeviceReading, 'id'>): Promise<number> {
    return await db.readings.add(reading as DeviceReading);
  }

  // Bulk insert readings (for batch saves)
  async bulkAdd(readings: Omit<DeviceReading, 'id'>[]): Promise<void> {
    await db.readings.bulkAdd(readings as DeviceReading[]);
  }

  // Get readings for a session
  async getBySession(sessionId: number): Promise<DeviceReading[]> {
    return await db.readings
      .where('sessionId')
      .equals(sessionId)
      .sortBy('timestamp');
  }

  // Get readings in time range
  async getByTimeRange(start: Date, end: Date): Promise<DeviceReading[]> {
    return await db.readings
      .where('timestamp')
      .between(start, end)
      .toArray();
  }

  // Get latest N readings for a session
  async getLatest(sessionId: number, count: number): Promise<DeviceReading[]> {
    return await db.readings
      .where('sessionId')
      .equals(sessionId)
      .reverse()
      .limit(count)
      .toArray();
  }

  // Live query for real-time updates (React integration)
  liveSessionReadings(sessionId: number) {
    return liveQuery(() =>
      db.readings
        .where('sessionId')
        .equals(sessionId)
        .sortBy('timestamp')
    );
  }

  // Aggregations for analytics
  async getSessionStats(sessionId: number): Promise<{
    avgTemperature: number;
    maxTemperature: number;
    avgPowerUsage: number;
    totalReadings: number;
    duration: number;
  }> {
    const readings = await this.getBySession(sessionId);
    if (readings.length === 0) {
      return { avgTemperature: 0, maxTemperature: 0, avgPowerUsage: 0, totalReadings: 0, duration: 0 };
    }

    const temps = readings.map(r => r.temperature);
    const power = readings.map(r => r.powerUsage);
    const duration = readings.length > 1
      ? (readings[readings.length - 1].timestamp.getTime() - readings[0].timestamp.getTime()) / 1000
      : 0;

    return {
      avgTemperature: temps.reduce((a, b) => a + b, 0) / temps.length,
      maxTemperature: Math.max(...temps),
      avgPowerUsage: power.reduce((a, b) => a + b, 0) / power.length,
      totalReadings: readings.length,
      duration
    };
  }

  // Delete old readings (retention policy)
  async deleteOlderThan(date: Date): Promise<number> {
    return await db.readings
      .where('timestamp')
      .below(date)
      .delete();
  }
}

export const readingsRepository = new ReadingsRepository();
```

### 4.2 Session Repository

```typescript
// src/db/repositories/SessionsRepository.ts
import { db, DeviceSession } from '../database';
import { liveQuery } from 'dexie';

export class SessionsRepository {

  async startSession(materialType?: string): Promise<number> {
    return await db.sessions.add({
      startTime: new Date(),
      materialType
    });
  }

  async endSession(sessionId: number): Promise<void> {
    await db.sessions.update(sessionId, {
      endTime: new Date()
    });
  }

  async getById(id: number): Promise<DeviceSession | undefined> {
    return await db.sessions.get(id);
  }

  async getAll(): Promise<DeviceSession[]> {
    return await db.sessions.orderBy('startTime').reverse().toArray();
  }

  async getRecent(count: number): Promise<DeviceSession[]> {
    return await db.sessions
      .orderBy('startTime')
      .reverse()
      .limit(count)
      .toArray();
  }

  async setAiRecommendation(sessionId: number, recommendation: DeviceSession['aiRecommendation']): Promise<void> {
    await db.sessions.update(sessionId, { aiRecommendation: recommendation });
  }

  liveSessions() {
    return liveQuery(() =>
      db.sessions.orderBy('startTime').reverse().toArray()
    );
  }
}

export const sessionsRepository = new SessionsRepository();
```

### 4.3 Settings Repository

```typescript
// src/db/repositories/SettingsRepository.ts
import { db, AppSetting } from '../database';

export class SettingsRepository {

  async get<T>(key: string, defaultValue: T): Promise<T> {
    const setting = await db.settings.get(key);
    return setting ? setting.value : defaultValue;
  }

  async set(key: string, value: any): Promise<void> {
    await db.settings.put({
      key,
      value,
      updatedAt: new Date()
    });
  }

  async getDeviceSettings(): Promise<{
    temperature: number;
    extrusionSpeed: number;
    shredderSpeed: number;
    pullingSpeed: number;
    fanSpeed: number;
    diameter: number;
  }> {
    return await this.get('deviceSettings', {
      temperature: 80,
      extrusionSpeed: 30,
      shredderSpeed: 50,
      pullingSpeed: 40,
      fanSpeed: 50,
      diameter: 1.75
    });
  }

  async saveDeviceSettings(settings: any): Promise<void> {
    await this.set('deviceSettings', settings);
  }
}

export const settingsRepository = new SettingsRepository();
```

---

## 5. Data Sampling Strategy

### 5.1 Sampling Rates

| Scenario | Rate | Rationale |
|----------|------|-----------|
| **Active Session (Device ON)** | Every 5 seconds | Captures meaningful changes without overwhelming storage |
| **Idle/Standby** | Every 60 seconds | Minimal storage while device is idle |
| **Critical Events** | Immediate | Temperature spikes, errors, state changes |

### 5.2 Implementation

```typescript
// src/services/DataCollectionService.ts
import { readingsRepository } from '../db/repositories/ReadingsRepository';
import { DeviceReading } from '../db/database';

export class DataCollectionService {
  private intervalId: NodeJS.Timeout | null = null;
  private currentSessionId: number | null = null;
  private isDeviceActive: boolean = false;

  private readonly ACTIVE_INTERVAL = 5000;   // 5 seconds
  private readonly IDLE_INTERVAL = 60000;    // 60 seconds

  start(sessionId: number, getDeviceState: () => Partial<DeviceReading>): void {
    this.currentSessionId = sessionId;
    this.scheduleCollection(getDeviceState);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentSessionId = null;
  }

  setDeviceActive(active: boolean, getDeviceState: () => Partial<DeviceReading>): void {
    this.isDeviceActive = active;
    // Reschedule with new interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.scheduleCollection(getDeviceState);
    }
  }

  private scheduleCollection(getDeviceState: () => Partial<DeviceReading>): void {
    const interval = this.isDeviceActive ? this.ACTIVE_INTERVAL : this.IDLE_INTERVAL;

    this.intervalId = setInterval(async () => {
      await this.collectReading(getDeviceState);
    }, interval);

    // Collect immediately on start
    this.collectReading(getDeviceState);
  }

  private async collectReading(getDeviceState: () => Partial<DeviceReading>): Promise<void> {
    if (!this.currentSessionId) return;

    const state = getDeviceState();

    await readingsRepository.add({
      sessionId: this.currentSessionId,
      timestamp: new Date(),
      temperature: state.temperature ?? 0,
      fanSpeed: state.fanSpeed ?? 0,
      diameter: state.diameter ?? 1.75,
      extrusionSpeed: state.extrusionSpeed ?? 0,
      shredderSpeed: state.shredderSpeed ?? 0,
      pullingSpeed: state.pullingSpeed ?? 0,
      powerUsage: state.powerUsage ?? 0,
      isShredding: state.isShredding ?? false,
      isMelting: state.isMelting ?? false,
      isExtruding: state.isExtruding ?? false
    });
  }

  // Force immediate save (for critical events)
  async saveNow(getDeviceState: () => Partial<DeviceReading>): Promise<void> {
    await this.collectReading(getDeviceState);
  }
}

export const dataCollectionService = new DataCollectionService();
```

---

## 6. Data Retention Policy

### 6.1 Retention Rules

| Data Type | Retention Period | Action |
|-----------|-----------------|--------|
| **Raw Readings** | 30 days | Delete |
| **Aggregated Daily Stats** | 1 year | Keep |
| **Sessions** | 1 year | Keep |
| **User Profile** | Permanent | Keep |

### 6.2 Storage Estimation

Assuming active use 4 hours/day:
- Readings per session: (4 hours * 60 min * 12 samples/min) = 2,880 readings
- Reading size: ~200 bytes
- Daily storage: ~576 KB
- 30-day storage: ~17 MB

**Conclusion:** Storage is not a concern. IndexedDB typically allows 50%+ of available disk space.

### 6.3 Cleanup Service

```typescript
// src/services/DataRetentionService.ts
import { readingsRepository } from '../db/repositories/ReadingsRepository';
import { db } from '../db/database';

export class DataRetentionService {

  private readonly READING_RETENTION_DAYS = 30;
  private readonly SESSION_RETENTION_DAYS = 365;

  async cleanup(): Promise<{ readingsDeleted: number; sessionsDeleted: number }> {
    const readingsCutoff = new Date();
    readingsCutoff.setDate(readingsCutoff.getDate() - this.READING_RETENTION_DAYS);

    const sessionsCutoff = new Date();
    sessionsCutoff.setDate(sessionsCutoff.getDate() - this.SESSION_RETENTION_DAYS);

    const readingsDeleted = await readingsRepository.deleteOlderThan(readingsCutoff);

    const sessionsDeleted = await db.sessions
      .where('endTime')
      .below(sessionsCutoff)
      .delete();

    return { readingsDeleted, sessionsDeleted };
  }

  // Run on app startup
  async runIfNeeded(): Promise<void> {
    const lastCleanup = await db.settings.get('lastDataCleanup');
    const now = new Date();

    // Run cleanup once per day
    if (!lastCleanup || (now.getTime() - new Date(lastCleanup.value).getTime()) > 86400000) {
      await this.cleanup();
      await db.settings.put({
        key: 'lastDataCleanup',
        value: now.toISOString(),
        updatedAt: now
      });
    }
  }
}

export const dataRetentionService = new DataRetentionService();
```

---

## 7. Export Functionality

### 7.1 Export Service

```typescript
// src/services/ExportService.ts
import { db, DeviceReading, DeviceSession } from '../db/database';

export type ExportFormat = 'csv' | 'json';

export class ExportService {

  // Export session with readings
  async exportSession(sessionId: number, format: ExportFormat): Promise<string> {
    const session = await db.sessions.get(sessionId);
    const readings = await db.readings
      .where('sessionId')
      .equals(sessionId)
      .toArray();

    if (format === 'json') {
      return JSON.stringify({ session, readings }, null, 2);
    }

    return this.toCSV(readings);
  }

  // Export all data in date range
  async exportDateRange(start: Date, end: Date, format: ExportFormat): Promise<string> {
    const readings = await db.readings
      .where('timestamp')
      .between(start, end)
      .toArray();

    if (format === 'json') {
      return JSON.stringify(readings, null, 2);
    }

    return this.toCSV(readings);
  }

  // Export daily aggregates
  async exportDailyStats(days: number): Promise<string> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const readings = await db.readings
      .where('timestamp')
      .aboveOrEqual(cutoff)
      .toArray();

    // Group by day
    const dailyStats = this.aggregateByDay(readings);

    return JSON.stringify(dailyStats, null, 2);
  }

  private toCSV(readings: DeviceReading[]): string {
    if (readings.length === 0) return '';

    const headers = [
      'timestamp', 'temperature', 'fanSpeed', 'diameter',
      'extrusionSpeed', 'shredderSpeed', 'pullingSpeed',
      'powerUsage', 'isShredding', 'isMelting', 'isExtruding'
    ];

    const rows = readings.map(r => [
      r.timestamp.toISOString(),
      r.temperature,
      r.fanSpeed,
      r.diameter,
      r.extrusionSpeed,
      r.shredderSpeed,
      r.pullingSpeed,
      r.powerUsage,
      r.isShredding,
      r.isMelting,
      r.isExtruding
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  private aggregateByDay(readings: DeviceReading[]): any[] {
    const byDay = new Map<string, DeviceReading[]>();

    for (const reading of readings) {
      const day = reading.timestamp.toISOString().split('T')[0];
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(reading);
    }

    return Array.from(byDay.entries()).map(([day, dayReadings]) => ({
      date: day,
      readingCount: dayReadings.length,
      avgTemperature: this.avg(dayReadings.map(r => r.temperature)),
      maxTemperature: Math.max(...dayReadings.map(r => r.temperature)),
      avgPowerUsage: this.avg(dayReadings.map(r => r.powerUsage)),
      totalPowerWh: this.avg(dayReadings.map(r => r.powerUsage)) * (dayReadings.length * 5 / 3600)
    }));
  }

  private avg(nums: number[]): number {
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  }

  // Trigger file download
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();
```

---

## 8. React Integration

### 8.1 Custom Hooks

```typescript
// src/hooks/useDeviceReadings.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

export function useSessionReadings(sessionId: number | null) {
  return useLiveQuery(
    () => sessionId
      ? db.readings.where('sessionId').equals(sessionId).sortBy('timestamp')
      : [],
    [sessionId],
    []
  );
}

export function useLatestReading(sessionId: number | null) {
  return useLiveQuery(
    () => sessionId
      ? db.readings.where('sessionId').equals(sessionId).last()
      : undefined,
    [sessionId]
  );
}

export function useRecentSessions(count: number = 10) {
  return useLiveQuery(
    () => db.sessions.orderBy('startTime').reverse().limit(count).toArray(),
    [count],
    []
  );
}
```

### 8.2 Context Integration

```typescript
// src/contexts/DeviceDataContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sessionsRepository } from '../db/repositories/SessionsRepository';
import { settingsRepository } from '../db/repositories/SettingsRepository';
import { dataCollectionService } from '../services/DataCollectionService';
import { DeviceSettings } from '../types';

interface DeviceDataContextType {
  currentSessionId: number | null;
  deviceSettings: DeviceSettings;
  setDeviceSettings: (settings: DeviceSettings) => void;
  startSession: (materialType?: string) => Promise<void>;
  endSession: () => Promise<void>;
  isRecording: boolean;
}

const DeviceDataContext = createContext<DeviceDataContextType | null>(null);

export function DeviceDataProvider({ children }: { children: React.ReactNode }) {
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [deviceSettings, setDeviceSettingsState] = useState<DeviceSettings>({
    temperature: 80,
    extrusionSpeed: 30,
    shredderSpeed: 50,
    pullingSpeed: 40,
    fanSpeed: 50,
    diameter: 1.75,
    powerUsage: 0,
    isShredding: false,
    isMelting: false,
    isExtruding: false,
  });

  // Load saved settings on mount
  useEffect(() => {
    settingsRepository.getDeviceSettings().then(saved => {
      setDeviceSettingsState(prev => ({ ...prev, ...saved }));
    });
  }, []);

  const setDeviceSettings = useCallback((settings: DeviceSettings) => {
    setDeviceSettingsState(settings);
    settingsRepository.saveDeviceSettings(settings);
  }, []);

  const getDeviceState = useCallback(() => deviceSettings, [deviceSettings]);

  const startSession = useCallback(async (materialType?: string) => {
    const sessionId = await sessionsRepository.startSession(materialType);
    setCurrentSessionId(sessionId);
    setIsRecording(true);
    dataCollectionService.start(sessionId, getDeviceState);
  }, [getDeviceState]);

  const endSession = useCallback(async () => {
    if (currentSessionId) {
      await sessionsRepository.endSession(currentSessionId);
      dataCollectionService.stop();
      setCurrentSessionId(null);
      setIsRecording(false);
    }
  }, [currentSessionId]);

  return (
    <DeviceDataContext.Provider value={{
      currentSessionId,
      deviceSettings,
      setDeviceSettings,
      startSession,
      endSession,
      isRecording
    }}>
      {children}
    </DeviceDataContext.Provider>
  );
}

export const useDeviceData = () => {
  const context = useContext(DeviceDataContext);
  if (!context) throw new Error('useDeviceData must be used within DeviceDataProvider');
  return context;
};
```

---

## 9. Migration Strategy

### Phase 1: Install Dependencies
```bash
npm install dexie dexie-react-hooks
```

### Phase 2: Create Database Layer
1. Create `src/db/database.ts` with schema
2. Create repository files
3. Create service files

### Phase 3: Update Types
```typescript
// types.ts - Extended
export interface DeviceSettings {
  temperature: number;
  extrusionSpeed: number;
  shredderSpeed: number;
  pullingSpeed: number;
  fanSpeed: number;          // NEW
  diameter: number;          // NEW
  powerUsage: number;        // NEW
  isShredding: boolean;
  isMelting: boolean;
  isExtruding: boolean;
}
```

### Phase 4: Migrate localStorage Data
```typescript
// src/db/migration.ts
import { db } from './database';
import { settingsRepository } from './repositories/SettingsRepository';

export async function migrateFromLocalStorage(): Promise<void> {
  // Check if migration already done
  const migrated = await db.settings.get('localStorageMigrated');
  if (migrated) return;

  // Migrate theme
  const theme = localStorage.getItem('theme');
  if (theme) {
    await settingsRepository.set('theme', theme);
  }

  // Migrate language
  const language = localStorage.getItem('language');
  if (language) {
    await settingsRepository.set('language', language);
  }

  // Migrate username
  const username = localStorage.getItem('username');
  if (username) {
    await db.userProfile.add({
      name: username,
      createdAt: new Date(),
      totalMaterialRecycled: 0,
      totalHoursActive: 0
    });
  }

  // Mark migration complete
  await settingsRepository.set('localStorageMigrated', true);

  console.log('Migration from localStorage complete');
}
```

### Phase 5: Update Provider Hierarchy
```typescript
// index.tsx
import { migrateFromLocalStorage } from './db/migration';
import { dataRetentionService } from './services/DataRetentionService';

// Run migrations and cleanup on app start
async function initializeApp() {
  await migrateFromLocalStorage();
  await dataRetentionService.runIfNeeded();
}

initializeApp().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <LanguageProvider>
          <DeviceDataProvider>
            <App />
          </DeviceDataProvider>
        </LanguageProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
});
```

---

## 10. File Structure (Final)

```
recyclemaster/
├── src/
│   ├── db/
│   │   ├── database.ts              # Dexie schema & types
│   │   ├── migration.ts             # localStorage migration
│   │   └── repositories/
│   │       ├── ReadingsRepository.ts
│   │       ├── SessionsRepository.ts
│   │       ├── SettingsRepository.ts
│   │       └── index.ts
│   ├── services/
│   │   ├── geminiService.ts         # Existing
│   │   ├── DataCollectionService.ts # NEW
│   │   ├── DataRetentionService.ts  # NEW
│   │   └── ExportService.ts         # NEW
│   ├── hooks/
│   │   ├── useDeviceReadings.ts     # NEW
│   │   └── index.ts
│   ├── contexts/
│   │   ├── ThemeContext.tsx         # Existing
│   │   ├── LanguageContext.tsx      # Existing
│   │   └── DeviceDataContext.tsx    # NEW
│   ├── components/
│   │   └── ... (existing)
│   ├── types.ts                     # Extended
│   ├── App.tsx
│   └── index.tsx
├── package.json
└── ...
```

---

## 11. Summary of Recommendations

| Aspect | Recommendation |
|--------|----------------|
| **Storage Technology** | Dexie.js (IndexedDB wrapper) |
| **Schema Version** | Start at v1, use Dexie migrations |
| **Sampling Rate** | 5s active, 60s idle |
| **Retention** | 30 days raw, 1 year aggregated |
| **Export Formats** | CSV and JSON |
| **React Integration** | `dexie-react-hooks` with `useLiveQuery` |

---

## 12. Implementation Checklist

- [ ] Install `dexie` and `dexie-react-hooks`
- [ ] Create database schema (`src/db/database.ts`)
- [ ] Create repositories (Readings, Sessions, Settings)
- [ ] Create services (DataCollection, DataRetention, Export)
- [ ] Create React hooks for data access
- [ ] Create DeviceDataContext
- [ ] Update `types.ts` with new fields
- [ ] Create migration script for localStorage
- [ ] Update `index.tsx` with new provider hierarchy
- [ ] Update ManageDevicePage to use new context
- [ ] Add analytics/graphs page (future)
- [ ] Add export UI (future)

---

## Appendix A: Why Not sql.js?

While sql.js is a capable solution, it has significant drawbacks for this use case:

1. **Persistence Complexity**: sql.js runs in-memory. To persist, you must:
   - Export DB as binary: `db.export()`
   - Convert to string: `toBinString()`
   - Store in localStorage (5-10MB limit) or IndexedDB
   - Re-import on every page load

2. **Bundle Size**: ~1MB WASM file vs Dexie's ~30KB

3. **No Reactivity**: Manual subscription vs Dexie's `liveQuery()`

4. **IndexedDB is Already a Database**: Using sql.js to store in IndexedDB adds unnecessary abstraction.

If this were an Electron app with file system access, `better-sqlite3` would be preferred. For browser-only, Dexie.js is optimal.

---

## Appendix B: Future Considerations

1. **Dexie Cloud**: If multi-device sync is needed, Dexie Cloud provides seamless sync
2. **Web Workers**: Move data collection to a worker for better performance
3. **Compression**: Compress old readings before archival
4. **Charts Library**: Integrate with Chart.js or Recharts for analytics visualization
