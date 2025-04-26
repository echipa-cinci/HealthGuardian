import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDistance } from "date-fns";

type ActiveAlert = {
  id: number;
  patientProfileId: number;
  parameterName: string;
  value: number;
  limitValue: number;
  limitType: string;
  status: "active" | "acknowledged";
  timestamp: string;
  patientName?: string;
};

const parameterColors: Record<string, string> = {
  temperature: "bg-red-100 text-red-800",
  ecg: "bg-purple-100 text-purple-800",
  spo2: "bg-blue-100 text-blue-800",
  pulse: "bg-yellow-100 text-yellow-800"
};

const ActiveAlertsCard = () => {
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveAlerts = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("/api/alerts/active/all", "GET");
        setActiveAlerts(response);
      } catch (error) {
        console.error("Error fetching active alerts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveAlerts();
    
    // Fetch active alerts every 30 seconds
    const interval = setInterval(fetchActiveAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Sort alerts by timestamp (newest first)
  const sortedAlerts = [...activeAlerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg font-semibold">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
          Active Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <span className="animate-pulse">Loading alerts...</span>
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="flex justify-center items-center py-8 text-gray-500">
            No active alerts
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-3 py-2 px-4 bg-gray-50 text-sm font-medium text-gray-500">
              <div>PATIENT</div>
              <div>DATA</div>
              <div>PARAMETRU</div>
            </div>
            {sortedAlerts.map((alert) => (
              <div key={alert.id} className="grid grid-cols-3 py-3 px-4 text-sm text-gray-800">
                <div className="flex items-center">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                  <span>{alert.patientName || `Patient #${alert.patientProfileId}`}</span>
                </div>
                <div>
                  {formatDistance(new Date(alert.timestamp), new Date(), { addSuffix: true })}
                </div>
                <div>
                  <span 
                    className={`px-2 py-1 rounded-md text-xs font-medium ${parameterColors[alert.parameterName.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}
                  >
                    {alert.parameterName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveAlertsCard;