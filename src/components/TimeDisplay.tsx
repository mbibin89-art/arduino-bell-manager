import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export const TimeDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardContent className="p-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="h-6 w-6 text-school-blue" />
            <span className="text-lg font-semibold">Current Time</span>
          </div>
          <div className="text-4xl font-bold text-time-display font-mono">
            {formatTime(currentTime)}
          </div>
          <div className="text-lg text-muted-foreground">
            {formatDate(currentTime)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};