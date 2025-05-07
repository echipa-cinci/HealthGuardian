import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthData } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useRef, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";

type PatientProfile = {
  id: number;
  userId: number;
  doctorId: number;
  age: number;
  cnp: string;
  address: string;
  phoneNumber: string;
  email: string;
  profession: string;
  workplace: string;
  medicalHistory: string;
  allergies: string;
  consultations: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Parameter = {
  id: number;
  patientProfileId: number;
  ecg: number;
  spo2: number;
  temperature: number;
  pulse: number;
  timestamp: string;
};

type Recommendation = {
  id: number;
  patientProfileId: number;
  type: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type Alert = {
  id: number;
  patientProfileId: number;
  parameterName: string;
  value: number;
  status: string;
  timestamp: string;
};

export default function PatientDashboard() {
  const [patientProfileId, setPatientProfileId] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get authenticated user
  const { data: authData } = useQuery<AuthData>({
    queryKey: ['/api/auth/status'],
  });

  // Get patient profile for current user
  const { data: patientProfile, isLoading: isProfileLoading } = useQuery<PatientProfile>({
    queryKey: ['/api/patient-profiles/user', authData?.user?.id],
    enabled: !!authData?.user?.id,
    queryFn: async () => {
      const res = await fetch(`/api/patient-profiles/user/${authData?.user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch patient profile');
      return res.json();
    },
  });

  // Update profile ID when profile data is loaded
  useEffect(() => {
    if (patientProfile?.id) {
      setPatientProfileId(patientProfile.id);
    }
  }, [patientProfile]);
  
  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!authData?.authenticated || !authData.user?.id) return;
    
    try {
      // Create WebSocket connection using the same host that's serving the page
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      console.log("WebSocket connecting to:", wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log("WebSocket connection established");
        // Register this connection with user ID
        ws.send(JSON.stringify({
          type: 'register',
          userId: authData.user?.id
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("WebSocket message received:", message);
          
          if (message.type === 'profile_update' && message.patientProfileId) {
            // Invalidate all queries related to the patient profile
            toast({
              title: "Profile Updated",
              description: "Your medical information has been updated",
            });
            
            queryClient.invalidateQueries({ 
              queryKey: ['/api/patient-profiles/user', authData.user?.id] 
            });
            
            if (patientProfileId) {
              queryClient.invalidateQueries({ 
                queryKey: ['/api/parameters', patientProfileId]
              });
              queryClient.invalidateQueries({ 
                queryKey: ['/api/recommendations', patientProfileId]
              });
              queryClient.invalidateQueries({ 
                queryKey: ['/api/alerts', patientProfileId]
              });
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };
      
      // Clean up WebSocket connection when component unmounts
      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      return () => {}; // Return empty cleanup function
    }
  }, [authData, queryClient, toast, patientProfileId]);

  // Get parameters for patient
  const { data: parameters = [], isLoading: isParametersLoading } = useQuery<Parameter[]>({
    queryKey: ['/api/parameters', patientProfileId],
    enabled: !!patientProfileId,
    queryFn: async () => {
      const res = await fetch(`/api/parameters/${patientProfileId}`);
      if (!res.ok) throw new Error('Failed to fetch parameters');
      return res.json();
    },
  });

  // Get recommendations for patient
  const { data: recommendations = [], isLoading: isRecommendationsLoading } = useQuery<Recommendation[]>({
    queryKey: ['/api/recommendations', patientProfileId],
    enabled: !!patientProfileId,
    queryFn: async () => {
      const res = await fetch(`/api/recommendations/${patientProfileId}`);
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      return res.json();
    },
  });

  // Get alerts for patient
  const { data: alerts = [], isLoading: isAlertsLoading } = useQuery<Alert[]>({
    queryKey: ['/api/alerts', patientProfileId],
    enabled: !!patientProfileId,
    queryFn: async () => {
      const res = await fetch(`/api/alerts/${patientProfileId}`);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      return res.json();
    },
  });

  const formatDateForDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Group recommendations by date for the calendar
  const recommendationsByDate = useMemo(() => {
    const result = new Map();
    
    recommendations.forEach(rec => {
      const date = new Date(rec.createdAt);
      // Reset time to 00:00:00 for date comparison
      const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      
      if (!result.has(dateKey)) {
        result.set(dateKey, []);
      }
      result.get(dateKey).push(rec);
    });
    
    return result;
  }, [recommendations]);
  
  // Create days with recommendations for the calendar
  const daysWithRecommendations = useMemo(() => {
    return Array.from(recommendationsByDate.keys()).map(dateStr => new Date(dateStr));
  }, [recommendationsByDate]);
  
  // Currently selected date for recommendation details
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  // Get recommendations for the selected date
  const selectedDateRecommendations = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateKey = new Date(
      selectedDate.getFullYear(), 
      selectedDate.getMonth(), 
      selectedDate.getDate()
    ).toISOString();
    
    return recommendationsByDate.get(dateKey) || [];
  }, [selectedDate, recommendationsByDate]);

  if (isProfileLoading || isParametersLoading || isRecommendationsLoading || isAlertsLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Prepare data for charts
  const temperatureData = parameters.map(p => ({
    timestamp: new Date(p.timestamp).toLocaleDateString(),
    value: p.temperature
  }));

  const pulseData = parameters.map(p => ({
    timestamp: new Date(p.timestamp).toLocaleDateString(),
    value: p.pulse
  }));

  const ecgData = parameters.map(p => ({
    timestamp: new Date(p.timestamp).toLocaleDateString(),
    value: p.ecg
  }));

  const spo2Data = parameters.map(p => ({
    timestamp: new Date(p.timestamp).toLocaleDateString(),
    value: p.spo2
  }));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Patient Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            {patientProfile ? (
              <div className="space-y-2">
                <p><strong>Age:</strong> {patientProfile.age}</p>
                <p><strong>CNP:</strong> {patientProfile.cnp}</p>
                <p><strong>Address:</strong> {patientProfile.address}</p>
                <p><strong>Phone:</strong> {patientProfile.phoneNumber}</p>
                <p><strong>Email:</strong> {patientProfile.email}</p>
                <div className="mt-4 pt-2 border-t">
                  <h3 className="font-semibold mb-2">Professional Details</h3>
                  <p><strong>Profession:</strong> {patientProfile.profession || 'Not specified'}</p>
                  <p><strong>Workplace:</strong> {patientProfile.workplace || 'Not specified'}</p>
                </div>
              </div>
            ) : (
              <p>No profile found. Please contact your doctor.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
          </CardHeader>
          <CardContent>
            {patientProfile ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Medical History</h3>
                  <p className="text-sm">{patientProfile.medicalHistory || 'No data available'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Allergies</h3>
                  <p className="text-sm">{patientProfile.allergies || 'No allergies recorded'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Previous Consultations</h3>
                  <p className="text-sm">{patientProfile.consultations || 'No consultations recorded'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Doctor's Recommendations</h3>
                  {recommendations.length > 0 ? (
                    <div className="space-y-2">
                      {recommendations.map(recommendation => (
                        <div key={recommendation.id} className="p-2 border rounded-lg">
                          <h4 className="font-medium text-sm">{recommendation.type}</h4>
                          <p className="text-sm text-gray-700">{recommendation.description}</p>
                          <div className="mt-1 text-xs text-gray-500">
                            {formatDateForDisplay(recommendation.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm">No recommendations available.</p>
                  )}
                </div>
              </div>
            ) : (
              <p>No medical information found.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Calendar Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recommendation Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  hasRecommendation: daysWithRecommendations
                }}
                modifiersStyles={{
                  hasRecommendation: {
                    fontWeight: 'bold',
                    backgroundColor: '#E8F5E9',
                    color: '#2E7D32',
                    borderRadius: '100%'
                  }
                }}
              />
              <div className="text-sm mt-2 text-gray-500">
                Dates with recommendations are highlighted in green
              </div>
            </div>
            <div>
              {selectedDate ? (
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Recommendations for {format(selectedDate, 'MMM d, yyyy')}
                  </h3>
                  {selectedDateRecommendations.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateRecommendations.map((rec: Recommendation) => (
                        <div key={rec.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{rec.type}</h4>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {format(new Date(rec.createdAt), 'h:mm a')}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No specific recommendations for this date.</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p>Select a date to view recommendations</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="alerts" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="parameters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Temperature History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={temperatureData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#2196F3" name="Temperature" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pulse History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={pulseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#4CAF50" name="Pulse" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ECG History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={ecgData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#F44336" name="ECG" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SPO2 History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={spo2Data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#9C27B0" name="SPO2" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Health Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`p-4 border rounded-lg ${
                        alert.status === 'active' ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {alert.parameterName.charAt(0).toUpperCase() + alert.parameterName.slice(1)} Alert
                          </h3>
                          <p className="text-gray-700">
                            Value: {alert.value} - {alert.status === 'active' ? 'Requires attention' : 'Acknowledged'}
                          </p>
                        </div>
                        <div 
                          className={`px-2 py-1 rounded text-xs ${
                            alert.status === 'active' ? 'bg-red-500 text-white' : 'bg-gray-300'
                          }`}
                        >
                          {alert.status}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {formatDateForDisplay(alert.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No alerts found. All parameters within normal range.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}