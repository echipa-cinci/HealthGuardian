import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AddSampleAlerts() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sampleParameters = [
    { name: 'temperature', minValue: 36, maxValue: 37.5 },
    { name: 'pulse', minValue: 60, maxValue: 100 },
    { name: 'spo2', minValue: 94, maxValue: 100 },
    { name: 'ecg', minValue: 60, maxValue: 90 }
  ];

  const names = [
    "Popescu Maria",
    "Ionescu Dan",
    "Dumitrescu Ana",
    "Popa Adrian",
    "Georgescu Elena"
  ];

  const dates = [
    "2025-04-12T10:30:00.000Z", // 12.04.2025
    "2025-04-15T14:45:00.000Z", // 15.04.2025
    "2025-04-18T09:15:00.000Z", // 18.04.2025
    "2025-04-20T16:20:00.000Z", // 20.04.2025
    "2025-04-23T11:10:00.000Z", // 23.04.2025
  ];
  
  const addSampleAlerts = async () => {
    try {
      setIsLoading(true);
      
      // Get patient profiles to get IDs
      const profiles = await apiRequest("/api/patients", "GET");
      
      if (!profiles || profiles.length === 0) {
        toast({
          title: "Error",
          description: "No patient profiles found!",
          variant: "destructive"
        });
        return;
      }
      
      // Clear existing active alerts
      const existingAlerts = await apiRequest("/api/alerts/active/all", "GET");
      for (const alert of existingAlerts || []) {
        await apiRequest(`/api/alerts/${alert.id}`, "DELETE");
      }
      
      // Create sample alerts for each patient profile (up to 5)
      for (let i = 0; i < Math.min(5, profiles.length); i++) {
        const profile = profiles[i];
        const parameter = sampleParameters[i % sampleParameters.length];
        const isHigh = Math.random() > 0.5;
        
        // Generate a value that's outside the normal range
        const value = isHigh 
          ? parameter.maxValue + Math.round((Math.random() * 10) * 10) / 10 
          : parameter.minValue - Math.round((Math.random() * 5) * 10) / 10;
        
        const limitValue = isHigh ? parameter.maxValue : parameter.minValue;
        
        const alert = {
          patientProfileId: profile.id,
          parameterName: parameter.name,
          value: value,
          limitValue: limitValue,
          limitType: isHigh ? "max" : "min",
          status: "active",
          timestamp: dates[i] || new Date().toISOString()
        };
        
        await apiRequest("/api/alerts", "POST", alert);
      }
      
      toast({
        title: "Success",
        description: "Added sample alerts successfully!",
        variant: "default"
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/active/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      
    } catch (error) {
      console.error("Error adding sample alerts:", error);
      toast({
        title: "Error",
        description: "Failed to add sample alerts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm"
      className="ml-2" 
      onClick={addSampleAlerts}
      disabled={isLoading}
    >
      {isLoading ? "Adding..." : "Add Sample Alerts"}
    </Button>
  );
}