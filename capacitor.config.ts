import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5ba6e0e1a3dd4312849f4c9077682f21',
  appName: 'School Bell Manager',
  webDir: 'dist',
  server: {
    url: 'https://5ba6e0e1-a3dd-4312-849f-4c9077682f21.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: "Scanning for bell controller...",
        cancel: "Cancel",
        availableDevices: "Available devices",
        noDeviceFound: "No bell controller found"
      }
    }
  }
};

export default config;