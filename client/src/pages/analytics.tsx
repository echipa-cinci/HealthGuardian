import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const Analytics = () => {
  const [period, setPeriod] = useState("month");
  
  // Sample data for demonstration - in a real app, this would come from an API
  const patientData = [
    { name: 'Jan', newPatients: 65, followUps: 45 },
    { name: 'Feb', newPatients: 59, followUps: 55 },
    { name: 'Mar', newPatients: 80, followUps: 70 },
    { name: 'Apr', newPatients: 81, followUps: 60 },
    { name: 'May', newPatients: 56, followUps: 50 },
    { name: 'Jun', newPatients: 55, followUps: 45 },
    { name: 'Jul', newPatients: 40, followUps: 60 },
  ];
  
  const departmentData = [
    { name: 'Cardiology', appointments: 80, completed: 70 },
    { name: 'Neurology', appointments: 65, completed: 55 },
    { name: 'Orthopedics', appointments: 70, completed: 60 },
    { name: 'Pediatrics', appointments: 55, completed: 45 },
    { name: 'General', appointments: 90, completed: 80 },
  ];
  
  const caseStatusData = [
    { name: 'Resolved', value: 540 },
    { name: 'Ongoing', value: 230 },
    { name: 'Critical', value: 45 },
  ];
  
  const patientAgeData = [
    { name: '0-18', value: 120 },
    { name: '19-35', value: 250 },
    { name: '36-50', value: 300 },
    { name: '51-65', value: 280 },
    { name: '65+', value: 180 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  return (
    <main className="flex-1 overflow-y-auto bg-neutral-light p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <Select defaultValue={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={patientData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="newPatients" stroke="#2196F3" name="New Patients" />
                  <Line type="monotone" dataKey="followUps" stroke="#4CAF50" name="Follow-ups" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="appointments" fill="#2196F3" name="Total Appointments" />
                  <Bar dataKey="completed" fill="#4CAF50" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="cases">
          <TabsList className="mb-4">
            <TabsTrigger value="cases">Case Analysis</TabsTrigger>
            <TabsTrigger value="demographics">Patient Demographics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cases">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Case Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={caseStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {caseStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recovery Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={[
                        { month: 'Jan', recoveryRate: 82 },
                        { month: 'Feb', recoveryRate: 84 },
                        { month: 'Mar', recoveryRate: 85 },
                        { month: 'Apr', recoveryRate: 86 },
                        { month: 'May', recoveryRate: 88 },
                        { month: 'Jun', recoveryRate: 87 },
                        { month: 'Jul', recoveryRate: 89 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[75, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="recoveryRate" 
                        stroke="#FF5722"
                        name="Recovery Rate (%)" 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="demographics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Age Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={patientAgeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {patientAgeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { region: 'North', patients: 240 },
                        { region: 'South', patients: 320 },
                        { region: 'East', patients: 180 },
                        { region: 'West', patients: 270 },
                        { region: 'Central', patients: 310 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="patients" fill="#8884d8" name="Patients" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Analytics;
