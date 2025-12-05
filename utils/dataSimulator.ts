
import { DeviceSettings, DeviceReading } from '../types';

/**
 * Simulates realistic device readings based on current settings
 */
export function simulateReading(
  settings: DeviceSettings,
  isDeviceOn: boolean
): { currentDiameter: number; powerUsage: number } {
  if (!isDeviceOn) {
    return { currentDiameter: 0, powerUsage: 0 };
  }

  // Simulate current diameter based on target with small variations
  const diameterVariation = (Math.random() - 0.5) * 0.1; // ±0.05mm variation
  const currentDiameter = Math.max(
    1.5,
    Math.min(2.0, settings.targetDiameter + diameterVariation)
  );

  // Simulate power usage based on active components
  let basePower = 50; // Idle power

  if (settings.isShredding) {
    basePower += 80 + (settings.shredderSpeed / 100) * 120; // 80-200W for shredder
  }

  if (settings.isMelting) {
    basePower += 50 + (settings.temperature / 250) * 150; // 50-200W for heater
  }

  if (settings.isExtruding) {
    basePower += 30 + (settings.extrusionSpeed / 100) * 70; // 30-100W for extruder
  }

  if (settings.isFanOn) {
    basePower += 10 + (settings.fanSpeed / 100) * 40; // 10-50W for fan
  }

  // Add some random fluctuation
  const powerVariation = (Math.random() - 0.5) * 20;
  const powerUsage = Math.max(0, Math.round(basePower + powerVariation));

  return {
    currentDiameter: Math.round(currentDiameter * 100) / 100,
    powerUsage,
  };
}

/**
 * Creates a DeviceReading object from current state
 */
export function createReading(
  settings: DeviceSettings,
  currentDiameter: number,
  powerUsage: number
): DeviceReading {
  return {
    timestamp: Date.now(),
    temperature: settings.temperature,
    fanSpeed: settings.fanSpeed,
    shredderSpeed: settings.shredderSpeed,
    extrusionSpeed: settings.extrusionSpeed,
    pullingSpeed: settings.pullingSpeed,
    currentDiameter,
    targetDiameter: settings.targetDiameter,
    powerUsage,
  };
}

/**
 * Generates mock historical data for testing analytics
 */
export function generateMockHistory(
  hours: number,
  intervalSeconds: number = 30
): DeviceReading[] {
  const readings: DeviceReading[] = [];
  const now = Date.now();
  const startTime = now - hours * 60 * 60 * 1000;
  const interval = intervalSeconds * 1000;

  let temperature = 180;
  let fanSpeed = 50;
  let shredderSpeed = 60;
  let extrusionSpeed = 40;
  let pullingSpeed = 45;
  let targetDiameter = 1.75;

  for (let time = startTime; time <= now; time += interval) {
    // Add gradual drift and occasional changes
    temperature += (Math.random() - 0.5) * 5;
    temperature = Math.max(150, Math.min(220, temperature));

    const diameterVariation = (Math.random() - 0.5) * 0.08;
    const currentDiameter = targetDiameter + diameterVariation;

    // Power based on temperature and speeds
    const powerUsage = 100 +
      (temperature / 250) * 150 +
      (shredderSpeed / 100) * 100 +
      (extrusionSpeed / 100) * 50 +
      (Math.random() - 0.5) * 30;

    readings.push({
      timestamp: time,
      temperature: Math.round(temperature * 10) / 10,
      fanSpeed,
      shredderSpeed,
      extrusionSpeed,
      pullingSpeed,
      currentDiameter: Math.round(currentDiameter * 100) / 100,
      targetDiameter,
      powerUsage: Math.round(powerUsage),
    });
  }

  return readings;
}
