import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartCardProps {
  title: string;
  chartType: "line" | "bar";
  period: string;
  height: number;
}

// Sample data - in a real app this would come from API
const sampleLineData = [
  { name: "Mon", newPatients: 4, followUps: 3 },
  { name: "Tue", newPatients: 3, followUps: 2 },
  { name: "Wed", newPatients: 5, followUps: 4 },
  { name: "Thu", newPatients: 2, followUps: 3 },
  { name: "Fri", newPatients: 6, followUps: 5 },
  { name: "Sat", newPatients: 4, followUps: 2 },
  { name: "Sun", newPatients: 3, followUps: 1 },
];

const sampleBarData = [
  { name: "Cardiology", appointments: 20, completed: 15 },
  { name: "Neurology", appointments: 15, completed: 12 },
  { name: "Orthopedics", appointments: 18, completed: 14 },
  { name: "Pediatrics", appointments: 12, completed: 10 },
  { name: "General", appointments: 25, completed: 20 },
];

const ChartCard = ({ title, chartType, period, height }: ChartCardProps) => {
  const [currentPeriod, setCurrentPeriod] = useState(period);
  
  const renderChart = () => {
    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={sampleLineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="newPatients" 
              stroke="#2196F3" 
              name="New Patients" 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="followUps" 
              stroke="#4CAF50" 
              name="Follow-ups" 
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={sampleBarData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="appointments" fill="#2196F3" name="Total Appointments" />
            <Bar dataKey="completed" fill="#4CAF50" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">{title}</h2>
          <div className="flex items-center">
            <Button 
              variant="ghost"
              size="sm"
              className="text-primary bg-primary/10 hover:bg-primary/20"
            >
              {currentPeriod}
            </Button>
          </div>
        </div>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
