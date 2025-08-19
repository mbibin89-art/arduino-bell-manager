import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bluetooth, Search, Wifi, WifiOff } from 'lucide-react';
import { useBluetooth } from '@/hooks/useBluetooth';
import { BluetoothDevice } from '@/types/bell';

export const BluetoothConnection = () => {
  const {
    isConnected,
    connectedDevice,
    availableDevices,
    isScanning,
    scanForDevices,
    connectToDevice,
    disconnect
  } = useBluetooth();

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bluetooth className="h-5 w-5 text-school-blue" />
          Bluetooth Connection
        </CardTitle>
        <CardDescription>
          Connect to your HC-05 bell controller module
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-bell-active" />
            ) : (
              <WifiOff className="h-4 w-4 text-bell-inactive" />
            )}
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Connected Device Info */}
        {connectedDevice && (
          <div className="p-3 rounded-lg bg-secondary/50 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{connectedDevice.name}</p>
                <p className="text-sm text-muted-foreground">
                  Device ID: {connectedDevice.deviceId}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={disconnect}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Scan and Connect */}
        {!isConnected && (
          <div className="space-y-3">
            <Button 
              onClick={scanForDevices} 
              disabled={isScanning}
              className="w-full shadow-button"
            >
              <Search className="h-4 w-4 mr-2" />
              {isScanning ? 'Scanning...' : 'Scan for Devices'}
            </Button>

            {/* Available Devices */}
            {availableDevices.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Available Devices:</p>
                {availableDevices.map((device) => (
                  <div 
                    key={device.deviceId}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Signal: {device.rssi}dBm
                      </p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => connectToDevice(device)}
                    >
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};