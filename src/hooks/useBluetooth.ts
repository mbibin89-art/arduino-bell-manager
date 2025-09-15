import { useState, useEffect } from 'react';
import { BluetoothDevice } from '@/types/bell';
import { toast } from '@/components/ui/use-toast';
import { BleClient, BleDevice, ScanResult } from '@capacitor-community/bluetooth-le';
import { BluetoothSerial } from '@e-is/capacitor-bluetooth-serial';
import { Capacitor } from '@capacitor/core';

export const useBluetooth = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // HC-05 service UUID (common for HC-05 modules)
  const HC05_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Bluetooth on component mount
    const initializeBluetooth = async () => {
      try {
        await BleClient.initialize();
      } catch (error) {
        console.error('Failed to initialize Bluetooth:', error);
      }
    };
    
    initializeBluetooth();
  }, []);

  const scanForDevices = async () => {
    try {
      setIsScanning(true);
      setAvailableDevices([]);

      // Check if running on native platform
      if (!Capacitor.isNativePlatform()) {
        toast({
          title: "Mobile App Required",
          description: "Bluetooth scanning requires the app to run on a mobile device. Export to GitHub and build for Android/iOS to test real Bluetooth functionality.",
          variant: "destructive"
        });
        setIsScanning(false);
        return;
      }

      console.log('Starting Bluetooth scan for HC-05 devices...');

      const devices: BluetoothDevice[] = [];

      // Scan for Bluetooth Classic devices (HC-05)
      try {
        console.log('Scanning for Bluetooth Classic devices...');
        const scanResult = await BluetoothSerial.scan();
        
        if (scanResult.devices) {
          scanResult.devices.forEach((device: any) => {
            const bluetoothDevice: BluetoothDevice = {
              deviceId: device.id || device.address,
              name: device.name || 'Unknown Classic Device',
              rssi: undefined, // Classic doesn't provide RSSI during discovery
              isConnected: false
            };
            
            // HC-05 devices get priority
            if (bluetoothDevice.name.toLowerCase().includes('hc-05') || 
                bluetoothDevice.name.toLowerCase().includes('hc05') ||
                bluetoothDevice.name.toLowerCase().includes('bell')) {
              devices.unshift(bluetoothDevice);
            } else {
              devices.push(bluetoothDevice);
            }
            
            console.log('Found Classic device:', bluetoothDevice.name, 'ID:', bluetoothDevice.deviceId);
          });
        }
      } catch (error) {
        console.log('Bluetooth Classic scan failed:', error);
      }

      // Also scan for BLE devices
      try {
        console.log('Scanning for BLE devices...');
        const hasPermission = await BleClient.isEnabled();
        if (!hasPermission) {
          await BleClient.requestEnable();
        }

        await BleClient.requestLEScan(
          { allowDuplicates: false },
          (result: ScanResult) => {
            const deviceName = result.device.name || result.localName || `Device-${result.device.deviceId.slice(-4)}`;
            
            const device: BluetoothDevice = {
              deviceId: result.device.deviceId,
              name: deviceName,
              rssi: result.rssi,
              isConnected: false
            };
            
            const existingIndex = devices.findIndex(d => d.deviceId === device.deviceId);
            if (existingIndex === -1) {
              if (deviceName.toLowerCase().includes('hc-05') || 
                  deviceName.toLowerCase().includes('hc05') ||
                  deviceName.toLowerCase().includes('bell')) {
                devices.unshift(device);
              } else {
                devices.push(device);
              }
              setAvailableDevices([...devices]);
              console.log('Found BLE device:', deviceName, 'RSSI:', result.rssi);
            }
          }
        );

        // Stop BLE scanning after 15 seconds
        setTimeout(async () => {
          try {
            await BleClient.stopLEScan();
          } catch (error) {
            console.error('Error stopping BLE scan:', error);
          }
        }, 15000);
      } catch (error) {
        console.log('BLE scan failed:', error);
      }

      // Update available devices and finish scanning
      setAvailableDevices([...devices]);
      
      setTimeout(() => {
        setIsScanning(false);
        
        if (devices.length === 0) {
          toast({
            title: "No Devices Found",
            description: "No bell controllers found. Make sure your HC-05 is in pairing mode and nearby.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Scan Complete",
            description: `Found ${devices.length} device(s) (Classic + BLE). Select one to connect.`,
          });
        }
      }, 15000);

    } catch (error) {
      console.error('Bluetooth scan error:', error);
      toast({
        title: "Scan Failed",
        description: "Failed to scan for devices. Please check Bluetooth permissions.",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      console.log('Attempting to connect to:', device.name, device.deviceId);
      
      // Try Bluetooth Classic connection first (for HC-05)
      try {
        console.log('Trying Bluetooth Classic connection...');
        await BluetoothSerial.connect({ address: device.deviceId });
        
        setConnectedDevice({...device, isConnected: true});
        setConnectedDeviceId(device.deviceId);
        setIsConnected(true);
        
        toast({
          title: "Connected (Classic)",
          description: `Successfully connected to ${device.name} via Bluetooth Classic`,
        });
        
        console.log('Connected via Bluetooth Classic to:', device.name);
        localStorage.setItem('lastConnectedDevice', device.deviceId);
        return;
      } catch (classicError) {
        console.log('Bluetooth Classic connection failed, trying BLE...', classicError);
      }
      
      // If Classic fails, try BLE connection
      try {
        await BleClient.connect(device.deviceId);
        
        setConnectedDevice({...device, isConnected: true});
        setConnectedDeviceId(device.deviceId);
        setIsConnected(true);
        
        toast({
          title: "Connected (BLE)",
          description: `Successfully connected to ${device.name} via Bluetooth LE`,
        });
        
        console.log('Connected via BLE to:', device.name);
        localStorage.setItem('lastConnectedDevice', device.deviceId);
      } catch (bleError) {
        throw new Error('Both Bluetooth Classic and BLE connections failed');
      }
      
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed", 
        description: `Failed to connect to ${device.name}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const disconnect = async () => {
    try {
      if (connectedDeviceId) {
        // Try to disconnect from both Classic and BLE
        try {
          await BluetoothSerial.disconnect({ address: connectedDeviceId });
          console.log('Disconnected from Bluetooth Classic');
        } catch (error) {
          console.log('Classic disconnect failed or not connected via Classic');
        }
        
        try {
          await BleClient.disconnect(connectedDeviceId);
          console.log('Disconnected from BLE');
        } catch (error) {
          console.log('BLE disconnect failed or not connected via BLE');
        }
      }
      
      setIsConnected(false);
      setConnectedDevice(null);
      setConnectedDeviceId(null);
      
      toast({
        title: "Disconnected",
        description: "Bluetooth device disconnected",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Disconnect failed:', error);
      // Still update UI even if disconnect failed
      setIsConnected(false);
      setConnectedDevice(null);
      setConnectedDeviceId(null);
    }
  };

  const sendScheduleData = async (schedules: any[]) => {
    console.log('=== MOBILE SEND SCHEDULE DATA START ===');
    console.log('sendScheduleData called:', {
      isConnected,
      connectedDeviceId,
      connectedDevice: connectedDevice?.name,
      schedulesCount: schedules.length,
      isNativePlatform: Capacitor.isNativePlatform()
    });

    // FORCE ENABLE FOR DEBUGGING - Remove platform check temporarily
    if (!Capacitor.isNativePlatform()) {
      console.log('Send failed: Not running on native platform');
      toast({
        title: "Mobile App Required",
        description: "Bluetooth communication requires the app to run on a mobile device. Export to GitHub and build for Android/iOS to test real Bluetooth functionality.",
        variant: "destructive"
      });
      return false;
    }
    
    if (!isConnected || !connectedDeviceId) {
      console.log('Connection check failed:', { isConnected, connectedDeviceId });
      toast({
        title: "Not Connected",
        description: "Please connect to bell controller first",
        variant: "destructive"
      });
      return false;
    }

    try {
      console.log('Formatting data for Arduino...');
      // Format data for Arduino
      const scheduleData = {
        type: 'schedules',
        data: schedules.map(schedule => ({
          id: schedule.id,
          name: schedule.name,
          time: schedule.time,
          date: schedule.date || null,
          active: schedule.isActive,
          interval: schedule.intervalType,
          recurring: schedule.isRecurring
        }))
      };

      const jsonData = JSON.stringify(scheduleData);
      console.log('JSON data to send:', jsonData);
      console.log('JSON data length:', jsonData.length);

      // Try Bluetooth Classic first (for HC-05)
      console.log('Attempting Bluetooth Classic transmission...');
      try {
        console.log('Calling BluetoothSerial.write with:', {
          address: connectedDeviceId,
          dataLength: jsonData.length + 1
        });
        
        // HC-05 expects data with proper termination
        const dataToSend = jsonData + '\n';
        console.log('Data being sent to HC-05:', dataToSend);
        
        await BluetoothSerial.write({ 
          address: connectedDeviceId, 
          value: dataToSend
        });
        
        console.log('SUCCESS: Bluetooth Classic transmission completed');
        
        toast({
          title: "Data Sent (Classic)",
          description: `Schedule data sent to ${connectedDevice?.name} via Bluetooth Classic`,
        });
        
        console.log('Schedule data sent successfully via Bluetooth Classic');
        console.log('=== MOBILE SEND SCHEDULE DATA END (SUCCESS) ===');
        return true;
      } catch (classicError) {
        console.log('Bluetooth Classic send failed:', classicError);
        console.log('Error details:', {
          name: classicError.name,
          message: classicError.message,
          stack: classicError.stack
        });
      }

      // If Classic fails, try BLE
      console.log('Attempting BLE transmission as fallback...');
      try {
        const CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
        const dataBytes = new TextEncoder().encode(jsonData + '\n');
        
        console.log('BLE write parameters:', {
          deviceId: connectedDeviceId,
          serviceUUID: HC05_SERVICE_UUID,
          characteristicUUID: CHARACTERISTIC_UUID,
          dataLength: dataBytes.length
        });
        
        await BleClient.write(
          connectedDeviceId,
          HC05_SERVICE_UUID,
          CHARACTERISTIC_UUID,
          new DataView(dataBytes.buffer)
        );

        console.log('SUCCESS: BLE transmission completed');
        
        toast({
          title: "Data Sent (BLE)",
          description: `Schedule data sent to ${connectedDevice?.name} via Bluetooth LE`,
        });

        console.log('Schedule data sent successfully via BLE');
        console.log('=== MOBILE SEND SCHEDULE DATA END (SUCCESS) ===');
        return true;
      } catch (bleError) {
        console.log('BLE transmission also failed:', bleError);
        console.log('BLE Error details:', {
          name: bleError.name,
          message: bleError.message,
          stack: bleError.stack
        });
        throw new Error('Both Bluetooth Classic and BLE data transmission failed');
      }

    } catch (error) {
      console.error('FINAL ERROR in sendScheduleData:', error);
      console.log('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      console.log('=== MOBILE SEND SCHEDULE DATA END (FAILED) ===');
      
      toast({
        title: "Send Failed",
        description: `Failed to send schedule data: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    isConnected,
    connectedDevice,
    availableDevices,
    isScanning,
    scanForDevices,
    connectToDevice,
    disconnect,
    sendScheduleData
  };
};