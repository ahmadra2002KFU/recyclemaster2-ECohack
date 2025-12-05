import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { DeviceReading } from '../types';

// Platform detection
const platform = Capacitor.getPlatform();
const isNative = platform === 'android' || platform === 'ios';

// Database instances
let sqliteConnection: SQLiteConnection | null = null;
let nativeDb: SQLiteDBConnection | null = null;
let webDb: SqlJsDatabase | null = null;
let dbInitPromise: Promise<void> | null = null;

const DB_NAME = 'recyclemaster';
const DB_VERSION = 1;
const DB_STORAGE_KEY = 'recyclemaster_db';

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    temperature REAL,
    fanSpeed REAL,
    shredderSpeed REAL,
    extrusionSpeed REAL,
    pullingSpeed REAL,
    currentDiameter REAL,
    targetDiameter REAL,
    powerUsage REAL
  );
`;

const CREATE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_readings_timestamp
  ON readings(timestamp);
`;

/**
 * Initialize the SQLite database (platform-aware)
 */
export async function initDatabase(): Promise<void> {
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    if (isNative) {
      await initNativeDatabase();
    } else {
      await initWebDatabase();
    }
  })();

  return dbInitPromise;
}

/**
 * Initialize native SQLite database (Android/iOS)
 */
async function initNativeDatabase(): Promise<void> {
  try {
    sqliteConnection = new SQLiteConnection(CapacitorSQLite);

    // Check connection consistency
    const retCC = await sqliteConnection.checkConnectionsConsistency();
    const isConn = (await sqliteConnection.isConnection(DB_NAME, false)).result;

    if (retCC.result && isConn) {
      nativeDb = await sqliteConnection.retrieveConnection(DB_NAME, false);
    } else {
      nativeDb = await sqliteConnection.createConnection(
        DB_NAME,
        false, // not encrypted
        'no-encryption',
        DB_VERSION,
        false // not read-only
      );
    }

    await nativeDb.open();

    // Create tables
    await nativeDb.execute(CREATE_TABLE_SQL);
    await nativeDb.execute(CREATE_INDEX_SQL);

    console.log('Native SQLite database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize native database:', error);
    throw error;
  }
}

/**
 * Initialize web SQLite database (sql.js)
 */
async function initWebDatabase(): Promise<void> {
  try {
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });

    // Try to load existing database from localStorage
    const savedData = localStorage.getItem(DB_STORAGE_KEY);
    if (savedData) {
      try {
        const uint8Array = new Uint8Array(
          atob(savedData)
            .split('')
            .map((c) => c.charCodeAt(0))
        );
        webDb = new SQL.Database(uint8Array);
      } catch (e) {
        console.warn('Failed to load saved database, creating new one:', e);
        webDb = new SQL.Database();
      }
    } else {
      webDb = new SQL.Database();
    }

    // Create tables
    webDb.run(CREATE_TABLE_SQL);
    webDb.run(CREATE_INDEX_SQL);

    console.log('Web SQLite database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize web database:', error);
    throw error;
  }
}

/**
 * Save database to storage (web only - native auto-persists)
 */
export function persistDatabase(): void {
  if (!isNative && webDb) {
    const data = webDb.export();
    const base64 = btoa(String.fromCharCode(...data));

    try {
      localStorage.setItem(DB_STORAGE_KEY, base64);
    } catch (e) {
      console.error('Failed to persist database:', e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        deleteOldReadings(3);
        const newData = webDb.export();
        const newBase64 = btoa(String.fromCharCode(...newData));
        localStorage.setItem(DB_STORAGE_KEY, newBase64);
      }
    }
  }
}

/**
 * Save a single reading to the database
 */
export async function saveReading(reading: DeviceReading): Promise<void> {
  await initDatabase();

  const values = [
    reading.timestamp,
    reading.temperature,
    reading.fanSpeed,
    reading.shredderSpeed,
    reading.extrusionSpeed,
    reading.pullingSpeed,
    reading.currentDiameter,
    reading.targetDiameter,
    reading.powerUsage,
  ];

  if (isNative && nativeDb) {
    await nativeDb.run(
      `INSERT INTO readings (
        timestamp, temperature, fanSpeed, shredderSpeed,
        extrusionSpeed, pullingSpeed, currentDiameter,
        targetDiameter, powerUsage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );
  } else if (webDb) {
    webDb.run(
      `INSERT INTO readings (
        timestamp, temperature, fanSpeed, shredderSpeed,
        extrusionSpeed, pullingSpeed, currentDiameter,
        targetDiameter, powerUsage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );

    // Persist every 10 readings
    const count = webDb.exec('SELECT COUNT(*) FROM readings')[0]?.values[0]?.[0] as number;
    if (count % 10 === 0) {
      persistDatabase();
    }
  }
}

/**
 * Save multiple readings in a batch
 */
export async function saveReadings(readings: DeviceReading[]): Promise<void> {
  await initDatabase();

  if (isNative && nativeDb) {
    const statements: { statement: string; values: (number | null)[] }[] = readings.map((reading) => ({
      statement: `INSERT INTO readings (
        timestamp, temperature, fanSpeed, shredderSpeed,
        extrusionSpeed, pullingSpeed, currentDiameter,
        targetDiameter, powerUsage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values: [
        reading.timestamp,
        reading.temperature,
        reading.fanSpeed,
        reading.shredderSpeed,
        reading.extrusionSpeed,
        reading.pullingSpeed,
        reading.currentDiameter,
        reading.targetDiameter,
        reading.powerUsage,
      ],
    }));

    await nativeDb.executeSet(statements);
  } else if (webDb) {
    webDb.run('BEGIN TRANSACTION');

    try {
      for (const reading of readings) {
        webDb.run(
          `INSERT INTO readings (
            timestamp, temperature, fanSpeed, shredderSpeed,
            extrusionSpeed, pullingSpeed, currentDiameter,
            targetDiameter, powerUsage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reading.timestamp,
            reading.temperature,
            reading.fanSpeed,
            reading.shredderSpeed,
            reading.extrusionSpeed,
            reading.pullingSpeed,
            reading.currentDiameter,
            reading.targetDiameter,
            reading.powerUsage,
          ]
        );
      }
      webDb.run('COMMIT');
      persistDatabase();
    } catch (e) {
      webDb.run('ROLLBACK');
      throw e;
    }
  }
}

/**
 * Get readings within a time range
 */
export async function getReadings(
  startTime: number,
  endTime: number
): Promise<DeviceReading[]> {
  await initDatabase();

  const sql = `SELECT id, timestamp, temperature, fanSpeed, shredderSpeed,
          extrusionSpeed, pullingSpeed, currentDiameter,
          targetDiameter, powerUsage
   FROM readings
   WHERE timestamp >= ? AND timestamp <= ?
   ORDER BY timestamp ASC`;

  if (isNative && nativeDb) {
    const result = await nativeDb.query(sql, [startTime, endTime]);
    return (result.values || []).map((row: Record<string, unknown>) => ({
      id: row.id as number,
      timestamp: row.timestamp as number,
      temperature: row.temperature as number,
      fanSpeed: row.fanSpeed as number,
      shredderSpeed: row.shredderSpeed as number,
      extrusionSpeed: row.extrusionSpeed as number,
      pullingSpeed: row.pullingSpeed as number,
      currentDiameter: row.currentDiameter as number,
      targetDiameter: row.targetDiameter as number,
      powerUsage: row.powerUsage as number,
    }));
  } else if (webDb) {
    const result = webDb.exec(sql, [startTime, endTime]);

    if (!result.length) return [];

    return result[0].values.map((row) => ({
      id: row[0] as number,
      timestamp: row[1] as number,
      temperature: row[2] as number,
      fanSpeed: row[3] as number,
      shredderSpeed: row[4] as number,
      extrusionSpeed: row[5] as number,
      pullingSpeed: row[6] as number,
      currentDiameter: row[7] as number,
      targetDiameter: row[8] as number,
      powerUsage: row[9] as number,
    }));
  }

  return [];
}

/**
 * Get the most recent reading
 */
export async function getLatestReading(): Promise<DeviceReading | null> {
  await initDatabase();

  const sql = `SELECT id, timestamp, temperature, fanSpeed, shredderSpeed,
          extrusionSpeed, pullingSpeed, currentDiameter,
          targetDiameter, powerUsage
   FROM readings
   ORDER BY timestamp DESC
   LIMIT 1`;

  if (isNative && nativeDb) {
    const result = await nativeDb.query(sql);
    if (!result.values || result.values.length === 0) return null;

    const row = result.values[0] as Record<string, unknown>;
    return {
      id: row.id as number,
      timestamp: row.timestamp as number,
      temperature: row.temperature as number,
      fanSpeed: row.fanSpeed as number,
      shredderSpeed: row.shredderSpeed as number,
      extrusionSpeed: row.extrusionSpeed as number,
      pullingSpeed: row.pullingSpeed as number,
      currentDiameter: row.currentDiameter as number,
      targetDiameter: row.targetDiameter as number,
      powerUsage: row.powerUsage as number,
    };
  } else if (webDb) {
    const result = webDb.exec(sql);

    if (!result.length || !result[0].values.length) return null;

    const row = result[0].values[0];
    return {
      id: row[0] as number,
      timestamp: row[1] as number,
      temperature: row[2] as number,
      fanSpeed: row[3] as number,
      shredderSpeed: row[4] as number,
      extrusionSpeed: row[5] as number,
      pullingSpeed: row[6] as number,
      currentDiameter: row[7] as number,
      targetDiameter: row[8] as number,
      powerUsage: row[9] as number,
    };
  }

  return null;
}

/**
 * Delete readings older than specified days (default: 7 days)
 */
export async function deleteOldReadings(days: number = 7): Promise<number> {
  await initDatabase();

  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

  if (isNative && nativeDb) {
    const result = await nativeDb.run('DELETE FROM readings WHERE timestamp < ?', [cutoffTime]);

    if ((result.changes?.changes || 0) > 0) {
      await nativeDb.execute('VACUUM');
    }

    return result.changes?.changes || 0;
  } else if (webDb) {
    webDb.run('DELETE FROM readings WHERE timestamp < ?', [cutoffTime]);
    const changes = webDb.getRowsModified();

    if (changes > 0) {
      webDb.run('VACUUM');
      persistDatabase();
    }

    return changes;
  }

  return 0;
}

/**
 * Get total count of readings
 */
export async function getReadingsCount(): Promise<number> {
  await initDatabase();

  if (isNative && nativeDb) {
    const result = await nativeDb.query('SELECT COUNT(*) as count FROM readings');
    return (result.values?.[0] as Record<string, number>)?.count || 0;
  } else if (webDb) {
    const result = webDb.exec('SELECT COUNT(*) FROM readings');
    return (result[0]?.values[0]?.[0] as number) || 0;
  }

  return 0;
}

/**
 * Clear all readings
 */
export async function clearAllReadings(): Promise<void> {
  await initDatabase();

  if (isNative && nativeDb) {
    await nativeDb.execute('DELETE FROM readings');
    await nativeDb.execute('VACUUM');
  } else if (webDb) {
    webDb.run('DELETE FROM readings');
    webDb.run('VACUUM');
    persistDatabase();
  }
}

/**
 * Close database connection (for cleanup)
 */
export async function closeDatabase(): Promise<void> {
  if (isNative && nativeDb && sqliteConnection) {
    await sqliteConnection.closeConnection(DB_NAME, false);
    nativeDb = null;
  }

  if (webDb) {
    persistDatabase();
    webDb.close();
    webDb = null;
  }

  dbInitPromise = null;
}
