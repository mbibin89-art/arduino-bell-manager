import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Trash2, CalendarDays } from 'lucide-react';
import { Holiday } from '@/types/bell';
import { toast } from '@/components/ui/use-toast';

export const HolidayManager = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: ''
  });

  useEffect(() => {
    // Load holidays from localStorage
    const saved = localStorage.getItem('schoolHolidays');
    if (saved) {
      setHolidays(JSON.parse(saved));
    }
  }, []);

  const saveHolidays = (newHolidays: Holiday[]) => {
    setHolidays(newHolidays);
    localStorage.setItem('schoolHolidays', JSON.stringify(newHolidays));
  };

  const addHoliday = () => {
    if (!formData.name || !formData.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in holiday name and date",
        variant: "destructive"
      });
      return;
    }

    const newHoliday: Holiday = {
      id: Date.now().toString(),
      name: formData.name,
      date: formData.date,
      description: formData.description
    };

    const newHolidays = [...holidays, newHoliday].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    saveHolidays(newHolidays);
    resetForm();
    setIsAddingHoliday(false);
    
    toast({
      title: "Holiday Added",
      description: `${formData.name} scheduled for ${formData.date}`,
    });
  };

  const deleteHoliday = (id: string) => {
    const newHolidays = holidays.filter(holiday => holiday.id !== id);
    saveHolidays(newHolidays);
    toast({
      title: "Holiday Deleted",
      description: "Holiday has been removed",
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      description: ''
    });
  };

  const isToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const isUpcoming = (date: string) => {
    const today = new Date();
    const holidayDate = new Date(date);
    const diffTime = holidayDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-school-blue" />
                School Holidays
              </CardTitle>
              <CardDescription>
                Manage holidays when bells should not ring
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsAddingHoliday(true)}
              className="shadow-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Holiday
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add Holiday Form */}
      {isAddingHoliday && (
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle>Add New Holiday</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="holidayName">Holiday Name</Label>
                <Input
                  id="holidayName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Christmas Day"
                />
              </div>
              <div>
                <Label htmlFor="holidayDate">Date</Label>
                <Input
                  id="holidayDate"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes about this holiday"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={addHoliday} className="shadow-button">
                Add Holiday
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingHoliday(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holidays List */}
      <div className="grid gap-4">
        {holidays.map((holiday) => (
          <Card key={holiday.id} className="bg-gradient-card shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-school-blue" />
                  <div>
                    <h3 className="font-semibold">{holiday.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(holiday.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {holiday.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {holiday.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isToday(holiday.date) && (
                    <Badge className="bg-school-orange text-white">Today</Badge>
                  )}
                  {isUpcoming(holiday.date) && !isToday(holiday.date) && (
                    <Badge variant="secondary">Upcoming</Badge>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteHoliday(holiday.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {holidays.length === 0 && (
          <Card className="bg-gradient-card shadow-card">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No holidays configured yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Add holidays to prevent bells from ringing on those days.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};