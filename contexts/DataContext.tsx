
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DeviceSettings, DeviceState, DeviceReading, DateRangeOption } from '../types';
import { simulateReading, createReading, generateMockHistory } from '../utils/dataSimulator';
import {
  initDatabase,
  saveReading,
  saveReadings,
  getReadings,
  getLatestReading,
  deleteOldReadings,
  persistDatabase,
} from '../services/databaseService';

interface DataContextType {
  // Real-time state
  deviceState: DeviceState;

  // Update device state (called by App when device settings change)
  updateDeviceState: (settings: DeviceSettings, isDeviceOn: boolean) => void;

  // Analytics data
  getAnalyticsData: (range: DateRangeOption) => Promise<DeviceReading[]>;

  // Database status
  isDbReady: boolean;
  readingsCount: number;
}

const DataContext = createContext<DataContextType | null>(null);

const RECORDING_INTERVAL_MS = 5000; // Save reading every 5 seconds
const SIMULATION_INTERVAL_MS = 1000; // Update simulated values every second

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [readingsCount, setReadingsCount] = useState(0);
  const [deviceState, setDeviceState] = useState<DeviceState>({
    currentDiameter: 0,
    powerUsage: 0,
    isRecording: false,
  });

  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef<DeviceSettings | null>(null);
  const isDeviceOnRef = useRef(false);

  // Initialize database
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setIsDbReady(true);

        // Check if we have any data, if not generate some mock history
        const latest = await getLatestReading();
        if (!latest) {
          // Generate 24 hours of mock data for demo purposes
          const mockData = generateMockHistory(24, 60); // 24 hours, 1 reading per minute
          await saveReadings(mockData);
          setReadingsCount(mockData.length);
        } else {
          // Count existing readings
          const readings = await getReadings(0, Date.now());
          setReadingsCount(readings.length);
        }

        // Clean old data
        await deleteOldReadings(7);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      persistDatabase();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    if (recordingIntervalRef.current) return;

    setDeviceState((prev) => ({ ...prev, isRecording: true }));

    recordingIntervalRef.current = setInterval(async () => {
      if (!settingsRef.current || !isDeviceOnRef.current) return;

      const simulated = simulateReading(settingsRef.current, isDeviceOnRef.current);

      const reading = createReading(
        settingsRef.current,
        simulated.currentDiameter,
        simulated.powerUsage
      );

      try {
        await saveReading(reading);
        setReadingsCount((prev) => prev + 1);
      } catch (error) {
        console.error('Failed to save reading:', error);
      }
    }, RECORDING_INTERVAL_MS);
  }, []);

  const stopRecording = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setDeviceState((prev) => ({ ...prev, isRecording: false }));
    persistDatabase();
  }, []);

  const startSimulation = useCallback(() => {
    if (simulationIntervalRef.current) return;

    simulationIntervalRef.current = setInterval(() => {
      if (!settingsRef.current) return;

      const simulated = simulateReading(settingsRef.current, isDeviceOnRef.current);
      setDeviceState((prev) => ({
        ...prev,
        currentDiameter: simulated.currentDiameter,
        powerUsage: simulated.powerUsage,
      }));
    }, SIMULATION_INTERVAL_MS);
  }, []);

  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setDeviceState((prev) => ({
      ...prev,
      currentDiameter: 0,
      powerUsage: 0,
    }));
  }, []);

  const updateDeviceState = useCallback(
    (settings: DeviceSettings, isDeviceOn: boolean) => {
      settingsRef.current = settings;
      const wasOn = isDeviceOnRef.current;
      isDeviceOnRef.current = isDeviceOn;

      if (isDeviceOn && isDbReady) {
        if (!wasOn) {
          // Device just turned on
          startSimulation();
          startRecording();
        }
      } else if (!isDeviceOn && wasOn) {
        // Device just turned off
        stopSimulation();
        stopRecording();
      }
    },
    [isDbReady, startSimulation, startRecording, stopSimulation, stopRecording]
  );

  const getAnalyticsData = useCallback(
    async (range: DateRangeOption): Promise<DeviceReading[]> => {
      const now = Date.now();
      let startTime: number;

      switch (range) {
        case '1h':
          startTime = now - 1 * 60 * 60 * 1000;
          break;
        case '6h':
          startTime = now - 6 * 60 * 60 * 1000;
          break;
        case '24h':
          startTime = now - 24 * 60 * 60 * 1000;
          break;
        case '7d':
          startTime = now - 7 * 24 * 60 * 60 * 1000;
          break;
        default:
          startTime = now - 24 * 60 * 60 * 1000;
      }

      return getReadings(startTime, now);
    },
    []
  );

  const value: DataContextType = {
    deviceState,
    updateDeviceState,
    getAnalyticsData,
    isDbReady,
    readingsCount,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
