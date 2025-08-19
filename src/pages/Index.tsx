import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Bluetooth, Calendar, Settings } from 'lucide-react';
import { BluetoothConnection } from '@/components/BluetoothConnection';
import { TimeDisplay } from '@/components/TimeDisplay';
import { ScheduleManager } from '@/components/ScheduleManager';
import { HolidayManager } from '@/components/HolidayManager';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8" />
            School Bell Manager
          </h1>
          <p className="text-white/90 mt-2">
            Arduino HC-05 Bluetooth Bell Controller
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Time Display */}
        <div className="mb-6">
          <TimeDisplay />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="schedules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="bluetooth" className="flex items-center gap-2">
              <Bluetooth className="h-4 w-4" />
              Bluetooth
            </TabsTrigger>
            <TabsTrigger value="holidays" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Holidays
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="space-y-6">
            <ScheduleManager />
          </TabsContent>

          <TabsContent value="bluetooth" className="space-y-6">
            <BluetoothConnection />
          </TabsContent>

          <TabsContent value="holidays" className="space-y-6">
            <HolidayManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
