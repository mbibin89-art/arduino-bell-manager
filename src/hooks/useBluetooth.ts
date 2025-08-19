import { useState, useEffect } from 'react';
import { BluetoothDevice } from '@/types/bell';
import { toast } from '@/components/ui/use-toast';

export const useBluetooth = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const scanForDevices = async () => {
    try {
      setIsScanning(true);
      // In a real app, this would use @capacitor-community/bluetooth-le
      // For now, we'll simulate the scanning process
      
      setTimeout(() => {
        setAvailableDevices([
          {
            deviceId: 'hc05-bell-001',
            name: 'HC-05 Bell Controller',
            rssi: -45,
            isConnected: false
          },
          {
            deviceId: 'hc05-bell-002', 
            name: 'HC-05 School Bell',
            rssi: -52,
            isConnected: false
          }
        ]);
        setIsScanning(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error scanning for devices:', error);
      toast({
        title: "Scan Failed",
        description: "Could not scan for Bluetooth devices",
        variant: "destructive"
      });
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      // Simulate connection process
      setConnectedDevice({ ...device, isConnected: true });
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
        description: `Could not connect to ${device.name}`,
        variant: "destructive"
      });
    }
  };

  const disconnect = async () => {
    try {
      setIsConnected(false);
      setConnectedDevice(null);
      
      toast({
        title: "Disconnected",
        description: "Bluetooth device disconnected",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const sendScheduleData = async (schedules: any[]) => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to bell controller first",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Here you would send the actual data to the Arduino
      // Format: JSON string with schedule data
      const data = JSON.stringify({
        schedules: schedules.map(s => ({
          time: s.time,
          date: s.date,
          active: s.isActive
        }))
      });
      
      console.log('Sending to Arduino:', data);
      
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
        description: "Could not send schedule to controller",
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