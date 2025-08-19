import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Edit, Trash2, Send } from 'lucide-react';
import { BellSchedule } from '@/types/bell';
import { useBluetooth } from '@/hooks/useBluetooth';
import { toast } from '@/components/ui/use-toast';

export const ScheduleManager = () => {
  const [schedules, setSchedules] = useState<BellSchedule[]>([]);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const { sendScheduleData, isConnected } = useBluetooth();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    time: '',
    date: '',
    intervalType: 'first' as BellSchedule['intervalType'],
    isActive: true,
    isRecurring: true
  });

  useEffect(() => {
    // Load schedules from localStorage
    const saved = localStorage.getItem('bellSchedules');
    if (saved) {
      setSchedules(JSON.parse(saved));
    }
  }, []);

  const saveSchedules = (newSchedules: BellSchedule[]) => {
    setSchedules(newSchedules);
    localStorage.setItem('bellSchedules', JSON.stringify(newSchedules));
  };

  const addSchedule = () => {
    if (!formData.name || !formData.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in name and time",
        variant: "destructive"
      });
      return;
    }

    const newSchedule: BellSchedule = {
      id: Date.now().toString(),
      name: formData.name,
      time: formData.time,
      date: formData.isRecurring ? undefined : formData.date,
      intervalType: formData.intervalType,
      isActive: formData.isActive,
      isRecurring: formData.isRecurring
    };

    const newSchedules = [...schedules, newSchedule];
    saveSchedules(newSchedules);
    resetForm();
    setIsAddingSchedule(false);
    
    toast({
      title: "Schedule Added",
      description: `${formData.name} scheduled for ${formData.time}`,
    });
  };

  const updateSchedule = (id: string) => {
    const newSchedules = schedules.map(schedule =>
      schedule.id === id ? { ...schedule, ...formData } : schedule
    );
    saveSchedules(newSchedules);
    setEditingSchedule(null);
    resetForm();
  };

  const deleteSchedule = (id: string) => {
    const newSchedules = schedules.filter(schedule => schedule.id !== id);
    saveSchedules(newSchedules);
    toast({
      title: "Schedule Deleted",
      description: "Bell schedule has been removed",
    });
  };

  const toggleSchedule = (id: string) => {
    const newSchedules = schedules.map(schedule =>
      schedule.id === id ? { ...schedule, isActive: !schedule.isActive } : schedule
    );
    saveSchedules(newSchedules);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      time: '',
      date: '',
      intervalType: 'first',
      isActive: true,
      isRecurring: true
    });
  };

  const sendToArduino = async () => {
    const activeSchedules = schedules.filter(s => s.isActive);
    const success = await sendScheduleData(activeSchedules);
    
    if (success) {
      toast({
        title: "Success",
        description: `Sent ${activeSchedules.length} schedules to bell controller`,
      });
    }
  };

  const getIntervalColor = (type: BellSchedule['intervalType']) => {
    const colors = {
      first: 'bg-school-blue',
      second: 'bg-school-green', 
      third: 'bg-school-orange',
      fourth: 'bg-purple-500',
      fifth: 'bg-pink-500',
      lunch: 'bg-yellow-500',
      break: 'bg-cyan-500',
      dismissal: 'bg-red-500',
      custom: 'bg-gray-500'
    };
    return colors[type];
  };

  return (
    <div className="space-y-6">
      {/* Header with Send Button */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-school-blue" />
                Bell Schedules
              </CardTitle>
              <CardDescription>
                Manage your school bell timing schedules
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={sendToArduino}
                disabled={!isConnected || schedules.filter(s => s.isActive).length === 0}
                className="shadow-button"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Controller
              </Button>
              <Button 
                onClick={() => setIsAddingSchedule(true)}
                className="shadow-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add/Edit Schedule Form */}
      {(isAddingSchedule || editingSchedule) && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>
              {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Schedule Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., First Period Bell"
                />
              </div>
              <div>
                <Label htmlFor="intervalType">Interval Type</Label>
                <Select 
                  value={formData.intervalType} 
                  onValueChange={(value) => setFormData({ ...formData, intervalType: value as BellSchedule['intervalType'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">First Period</SelectItem>
                    <SelectItem value="second">Second Period</SelectItem>
                    <SelectItem value="third">Third Period</SelectItem>
                    <SelectItem value="fourth">Fourth Period</SelectItem>
                    <SelectItem value="fifth">Fifth Period</SelectItem>
                    <SelectItem value="lunch">Lunch Break</SelectItem>
                    <SelectItem value="break">Short Break</SelectItem>
                    <SelectItem value="dismissal">School Dismissal</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="time">Time (HH:MM:SS)</Label>
                <Input
                  id="time"
                  type="time"
                  step="1"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              {!formData.isRecurring && (
                <div>
                  <Label htmlFor="date">Specific Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
                />
                <Label htmlFor="recurring">Daily Recurring</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingSchedule ? () => updateSchedule(editingSchedule) : addSchedule}
                className="shadow-button"
              >
                {editingSchedule ? 'Update' : 'Add'} Schedule
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingSchedule(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getIntervalColor(schedule.intervalType)}`} />
                  <div>
                    <h3 className="font-semibold">{schedule.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {schedule.time} {schedule.date && `on ${schedule.date}`}
                      {schedule.isRecurring && ' (Daily)'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                    {schedule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSchedule(schedule.id)}
                    >
                      {schedule.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          name: schedule.name,
                          time: schedule.time,
                          date: schedule.date || '',
                          intervalType: schedule.intervalType,
                          isActive: schedule.isActive,
                          isRecurring: schedule.isRecurring
                        });
                        setEditingSchedule(schedule.id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {schedules.length === 0 && (
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No bell schedules configured yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first schedule to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};