import { useState, useEffect } from 'react';
import { BluetoothDevice } from '@/types/bell';
import { toast } from '@/components/ui/use-toast';
import { BleClient, BleDevice, ScanResult } from '@capacitor-community/bluetooth-le';

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

      // Request Bluetooth permissions
      const hasPermission = await BleClient.isEnabled();
      if (!hasPermission) {
        await BleClient.requestEnable();
      }

      const devices: BluetoothDevice[] = [];

      // Start scanning for devices
      await BleClient.requestLEScan(
        {
          services: [HC05_SERVICE_UUID], // Look for HC-05 devices
          allowDuplicates: false
        },
        (result: ScanResult) => {
          const device: BluetoothDevice = {
            deviceId: result.device.deviceId,
            name: result.device.name || result.localName || 'Unknown Device',
            rssi: result.rssi,
            isConnected: false
          };
          
          // Only add HC-05 or devices with "bell" in the name
          if (device.name.toLowerCase().includes('hc-05') || 
              device.name.toLowerCase().includes('bell') ||
              device.name.toLowerCase().includes('school')) {
            devices.push(device);
            setAvailableDevices([...devices]);
          }
        }
      );

      // Stop scanning after 10 seconds
      setTimeout(async () => {
        await BleClient.stopLEScan();
        setIsScanning(false);
        
        if (devices.length === 0) {
          toast({
            title: "No Devices Found",
            description: "No HC-05 bell controllers found. Make sure your device is paired and nearby.",
            variant: "destructive"
          });
        }
      }, 10000);

    } catch (error) {
      console.error('Error scanning for devices:', error);
      toast({
        title: "Scan Failed",
        description: "Could not scan for Bluetooth devices. Make sure Bluetooth is enabled.",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      // Connect to the BLE device
      await BleClient.connect(device.deviceId);
      
      setConnectedDevice({ ...device, isConnected: true });
      setConnectedDeviceId(device.deviceId);
      setIsConnected(true);
      
      toast({
        title: "Connected",
        description: `Connected to ${device.name}`,
        variant: "default"
      });
      
      // Update localStorage for auto-connect
      localStorage.setItem('lastConnectedDevice', device.deviceId);
      
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: `Could not connect to ${device.name}. Make sure it's in pairing mode.`,
        variant: "destructive"
      });
    }
  };

  const disconnect = async () => {
    try {
      if (connectedDeviceId) {
        await BleClient.disconnect(connectedDeviceId);
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
    if (!isConnected || !connectedDeviceId) {
      toast({
        title: "Not Connected",
        description: "Please connect to bell controller first",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Format data for Arduino
      const data = JSON.stringify({
        schedules: schedules.map(s => ({
          time: s.time,
          date: s.date,
          active: s.isActive
        }))
      });
      
      // HC-05 characteristic UUID for data transmission
      const CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
      
      // Convert string to bytes
      const dataBytes = new TextEncoder().encode(data);
      
      // Send data via BLE characteristic
      await BleClient.write(
        connectedDeviceId,
        HC05_SERVICE_UUID,
        CHARACTERISTIC_UUID,
        new DataView(dataBytes.buffer)
      );
      
      console.log('Successfully sent to Arduino:', data);
      
      toast({
        title: "Schedule Sent",
        description: `Sent ${schedules.length} bell schedules to controller`,
        variant: "default"
      });
      
      return true;
    } catch (error) {
      console.error('Send failed:', error);
      toast({
        title: "Send Failed",
        description: "Could not send schedule to controller. Check connection.",
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