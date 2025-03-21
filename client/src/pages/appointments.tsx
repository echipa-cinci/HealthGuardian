import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Plus, Calendar as CalendarIcon } from "lucide-react";

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'noShow': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const Appointments = () => {
  const [view, setView] = useState<'upcoming' | 'calendar'>('upcoming');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { data: upcomingAppointments, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['/api/appointments/upcoming'],
    queryFn: async () => {
      const res = await fetch('/api/appointments/upcoming');
      if (!res.ok) throw new Error('Failed to fetch upcoming appointments');
      return res.json();
    }
  });
  
  const { data: dateAppointments, isLoading: isLoadingDateAppointments } = useQuery({
    queryKey: ['/api/appointments/date', selectedDate.toISOString()],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await fetch(`/api/appointments?date=${dateStr}`);
      if (!res.ok) throw new Error('Failed to fetch appointments for date');
      return res.json();
    },
    enabled: view === 'calendar'
  });
  
  return (
    <main className="flex-1 overflow-y-auto bg-neutral-light p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>
        
        <Tabs defaultValue="upcoming" onValueChange={(value) => setView(value as 'upcoming' | 'calendar')}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUpcoming ? (
                      Array(5).fill(0).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        </TableRow>
                      ))
                    ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
                      upcomingAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">Patient #{appointment.patientId}</TableCell>
                          <TableCell>
                            {format(new Date(appointment.date), 'MMM d, yyyy')}
                            <div className="text-sm text-gray-500">
                              {format(new Date(appointment.date), 'h:mm a')}
                            </div>
                          </TableCell>
                          <TableCell>{appointment.reason}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status === 'noShow' ? 'No Show' : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">No upcoming appointments</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="calendar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardContent className="p-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    Appointments for {format(selectedDate, 'MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingDateAppointments ? (
                    <div className="space-y-3">
                      {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : dateAppointments && dateAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {dateAppointments.map((appointment) => (
                        <div 
                          key={appointment.id} 
                          className="p-4 rounded-lg border bg-card"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Patient #{appointment.patientId}</p>
                              <p className="text-sm text-muted-foreground mt-1">{appointment.reason}</p>
                            </div>
                            <div className="flex items-center">
                              <Badge className={getStatusColor(appointment.status)}>
                                {appointment.status === 'noShow' ? 'No Show' : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </Badge>
                              <span className="ml-2 text-sm">{format(new Date(appointment.date), 'h:mm a')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No appointments scheduled for this day
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Appointments;
