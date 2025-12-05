
export enum Page {
  ManageDevice,
  AiAssistant,
  Analytics,
  Profile,
}

export interface DeviceSettings {
  temperature: number;
  extrusionSpeed: number;
  shredderSpeed: number;
  pullingSpeed: number;
  fanSpeed: number;
  targetDiameter: number;
  isShredding: boolean;
  isMelting: boolean;
  isExtruding: boolean;
  isFanOn: boolean;
}

export type AiAssistantMode = 'control' | 'support';

export interface ChatMessage {
  speaker: 'user' | 'model';
  text: string;
}

export interface DeviceReading {
  id?: number;
  timestamp: number;
  temperature: number;
  fanSpeed: number;
  shredderSpeed: number;
  extrusionSpeed: number;
  pullingSpeed: number;
  currentDiameter: number;
  targetDiameter: number;
  powerUsage: number;
}

export interface DeviceState {
  currentDiameter: number;
  powerUsage: number;
  isRecording: boolean;
}

export type DateRangeOption = '1h' | '6h' | '24h' | '7d';

export interface DateRange {
  start: Date;
  end: Date;
}
