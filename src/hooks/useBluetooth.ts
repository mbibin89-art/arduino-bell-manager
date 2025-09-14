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
    console.log('sendScheduleData called:', {
      isConnected,
      connectedDeviceId,
      schedulesCount: schedules.length
    });
    
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
      console.log('Sending schedule data:', jsonData);

      // Try Bluetooth Classic first (for HC-05)
      try {
        await BluetoothSerial.write({ 
          address: connectedDeviceId, 
          value: jsonData + '\n' 
        });
        
        toast({
          title: "Data Sent (Classic)",
          description: `Schedule data sent to ${connectedDevice?.name} via Bluetooth Classic`,
        });
        
        console.log('Schedule data sent successfully via Bluetooth Classic');
        return true;
      } catch (classicError) {
        console.log('Classic data send failed, trying BLE...', classicError);
      }

      // If Classic fails, try BLE
      try {
        const CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
        const dataBytes = new TextEncoder().encode(jsonData + '\n');
        
        await BleClient.write(
          connectedDeviceId,
          HC05_SERVICE_UUID,
          CHARACTERISTIC_UUID,
          new DataView(dataBytes.buffer)
        );

        toast({
          title: "Data Sent (BLE)",
          description: `Schedule data sent to ${connectedDevice?.name} via Bluetooth LE`,
        });

        console.log('Schedule data sent successfully via BLE');
        return true;
      } catch (bleError) {
        throw new Error('Both Bluetooth Classic and BLE data transmission failed');
      }

    } catch (error) {
      console.error('Failed to send schedule data:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send schedule data to the device",
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