export interface BellSchedule {
  id: string;
  name: string;
  time: string; // HH:MM:SS format
  date?: string; // YYYY-MM-DD format, optional for recurring schedules
  isActive: boolean;
  intervalType: 'first' | 'second' | 'third' | 'fourth' | 'fifth' | 'lunch' | 'break' | 'dismissal' | 'custom';
  isRecurring: boolean; // true for daily schedules, false for specific dates
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD format
  description?: string;
}

export interface BluetoothDevice {
  deviceId: string;
  name: string;
  rssi?: number;
  isConnected: boolean;
}

export interface AppSettings {
  deviceName: string;
  autoConnect: boolean;
  schoolName: string;
  lastConnectedDevice?: string;
}