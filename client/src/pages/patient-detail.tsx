import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AlertCircle, Edit, Trash, PlusCircle, Check, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Recommendation } from "@shared/schema";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Define types
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
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
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

type ParameterLimit = {
  id: number;
  patientProfileId: number;
  parameterName: string;
  minValue: number;
  maxValue: number;
  updatedAt: string;
};

type Alert = {
  id: number;
  patientProfileId: number;
  parameterName: string;
  value: number;
  limitValue: number;
  limitType: string;
  status: "active" | "acknowledged";
  timestamp: string;
  patientNote?: string;
};

// Form schemas
const patientUpdateSchema = z.object({
  age: z.coerce.number().min(0).max(120).optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional(),
  profession: z.string().optional(),
  workplace: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  consultations: z.string().optional(),
  isActive: z.boolean().optional(),
});

const parameterLimitSchema = z.object({
  parameterName: z.string(),
  minValue: z.coerce.number(),
  maxValue: z.coerce.number(),
});

const recommendationSchema = z.object({
  type: z.string().min(1, "Type is required"),
  description: z.string().min(1, "Description is required"),
});

const PatientDetail = () => {
  const [, params] = useRoute<{ id: string }>("/patients/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddLimitDialogOpen, setIsAddLimitDialogOpen] = useState(false);
  const [isAddRecommendationDialogOpen, setIsAddRecommendationDialogOpen] = useState(false);
  const [isEditRecommendationDialogOpen, setIsEditRecommendationDialogOpen] = useState(false);
  const [editingRecommendationId, setEditingRecommendationId] = useState<number | null>(null);
  const [selectedLimitIds, setSelectedLimitIds] = useState<number[]>([]);
  const [selectedAlertIds, setSelectedAlertIds] = useState<number[]>([]);

  const patientId = params?.id ? parseInt(params.id) : 0;

  // Forms
  const patientForm = useForm<z.infer<typeof patientUpdateSchema>>({
    resolver: zodResolver(patientUpdateSchema),
  });

  const limitForm = useForm<z.infer<typeof parameterLimitSchema>>({
    resolver: zodResolver(parameterLimitSchema),
    defaultValues: {
      parameterName: "temperature",
      minValue: 36.0,
      maxValue: 37.5,
    },
  });
  
  const recommendationForm = useForm<z.infer<typeof recommendationSchema>>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      type: "",
      description: "",
    },
  });

  // Fetch patient data
  const { data: patient, isLoading: isLoadingPatient } = useQuery({
    queryKey: [`/api/patient-profiles/${patientId}`],
    queryFn: async () => {
      const res = await fetch(`/api/patient-profiles/${patientId}`);
      if (!res.ok) throw new Error("Failed to fetch patient");
      return res.json();
    },
    enabled: !!patientId,
  });

  // Fetch parameters
  const { data: parameters = [], isLoading: isLoadingParameters } = useQuery({
    queryKey: [`/api/parameters/${patientId}`],
    queryFn: async () => {
      const res = await fetch(`/api/parameters/${patientId}`);
      if (!res.ok) throw new Error("Failed to fetch parameters");
      return res.json();
    },
    enabled: !!patientId,
  });

  // Fetch parameter limits
  const { data: parameterLimits = [], isLoading: isLoadingLimits } = useQuery({
    queryKey: [`/api/parameter-limits/${patientId}`],
    queryFn: async () => {
      const res = await fetch(`/api/parameter-limits/${patientId}`);
      if (!res.ok) throw new Error("Failed to fetch parameter limits");
      return res.json();
    },
    enabled: !!patientId,
  });

  // Fetch recommendations
  const { data: recommendations = [], isLoading: isLoadingRecommendations } = useQuery({
    queryKey: [`/api/recommendations/${patientId}`],
    queryFn: async () => {
      const res = await fetch(`/api/recommendations/${patientId}`);
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return res.json();
    },
    enabled: !!patientId,
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: [`/api/alerts/${patientId}`],
    queryFn: async () => {
      const res = await fetch(`/api/alerts/${patientId}`);
      if (!res.ok) throw new Error("Failed to fetch alerts");
      return res.json();
    },
    enabled: !!patientId,
  });

  // Update patient mutation
  const updatePatient = useMutation({
    mutationFn: async (data: z.infer<typeof patientUpdateSchema>) => {
      const res = await fetch(`/api/patient-profiles/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update patient");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/patient-profiles/${patientId}`],
      });
      toast({
        title: "Success",
        description: "Patient information updated",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete patient mutation
  const deletePatient = useMutation({
    mutationFn: async () => {
      // This endpoint will need to be implemented in the server
      const res = await fetch(`/api/patient-profiles/${patientId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete patient");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient removed from your list",
      });
      navigate("/patients");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add parameter limit mutation
  const addParameterLimit = useMutation({
    mutationFn: async (data: z.infer<typeof parameterLimitSchema>) => {
      const res = await fetch("/api/parameter-limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientProfileId: patientId,
          ...data,
        }),
      });
      if (!res.ok) throw new Error("Failed to add parameter limit");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both parameter limits and alerts to refresh both
      queryClient.invalidateQueries({
        queryKey: [`/api/parameter-limits/${patientId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/alerts/${patientId}`],
      });
      toast({
        title: "Success",
        description: "Parameter limit added and alerts updated",
      });
      setIsAddLimitDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete parameter limit mutation
  const deleteParameterLimit = useMutation({
    mutationFn: async (limitIds: number[]) => {
      if (limitIds.length === 0) return;
      
      // Delete each limit one by one
      for (const limitId of limitIds) {
        const res = await fetch(`/api/parameter-limits/${limitId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`Failed to delete parameter limit ${limitId}`);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      // Invalidate both parameter limits and alerts queries
      queryClient.invalidateQueries({
        queryKey: [`/api/parameter-limits/${patientId}`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/alerts/${patientId}`],
      });
      toast({
        title: "Success",
        description: selectedLimitIds.length > 1 
          ? "Parameter limits removed and alerts updated" 
          : "Parameter limit removed and alerts updated",
      });
      // Clear selected ids after deletion
      setSelectedLimitIds([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update alert status mutation
  const updateAlertStatus = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "acknowledged" }),
      });
      if (!res.ok) throw new Error("Failed to update alert status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/alerts/${patientId}`] });
      toast({
        title: "Success",
        description: "Alert acknowledged",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete alert mutation
  const deleteAlert = useMutation({
    mutationFn: async (alertIds: number[]) => {
      if (alertIds.length === 0) return;
      
      // Delete each alert one by one
      for (const alertId of alertIds) {
        const res = await fetch(`/api/alerts/${alertId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`Failed to delete alert ${alertId}`);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/alerts/${patientId}`],
      });
      toast({
        title: "Success",
        description: selectedAlertIds.length > 1 
          ? "Alerts deleted successfully" 
          : "Alert deleted successfully",
      });
      // Clear selected ids after deletion
      setSelectedAlertIds([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set default form values when patient data is loaded
  useEffect(() => {
    if (patient) {
      patientForm.reset({
        age: patient.age,
        address: patient.address,
        phoneNumber: patient.phoneNumber,
        email: patient.email,
        profession: patient.profession,
        workplace: patient.workplace,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies,
        consultations: patient.consultations,
        isActive: patient.isActive,
      });
    }
  }, [patient]);

  // Format chart data
  const chartData = parameters
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
    .map((param) => ({
      timestamp: format(new Date(param.timestamp), "HH:mm:ss"),
      temperature: param.temperature,
      pulse: param.pulse,
      spo2: param.spo2,
      ecg: param.ecg,
    }));

  // Handle form submissions
  const onUpdatePatient = (data: z.infer<typeof patientUpdateSchema>) => {
    updatePatient.mutate(data);
  };

  const onAddLimit = (data: z.infer<typeof parameterLimitSchema>) => {
    addParameterLimit.mutate(data);
  };
  
  // Add recommendation mutation
  const addRecommendation = useMutation({
    mutationFn: async (data: z.infer<typeof recommendationSchema>) => {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientProfileId: patientId,
          ...data,
        }),
      });
      if (!res.ok) throw new Error("Failed to add recommendation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/recommendations/${patientId}`],
      });
      toast({
        title: "Success",
        description: "Recommendation added successfully",
      });
      setIsAddRecommendationDialogOpen(false);
      recommendationForm.reset({ type: "", description: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onAddRecommendation = (data: z.infer<typeof recommendationSchema>) => {
    addRecommendation.mutate(data);
  };
  
  // Update recommendation mutation
  const updateRecommendation = useMutation({
    mutationFn: async (data: z.infer<typeof recommendationSchema> & { id: number }) => {
      const res = await fetch(`/api/recommendations/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.type,
          description: data.description,
        }),
      });
      if (!res.ok) throw new Error("Failed to update recommendation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/recommendations/${patientId}`],
      });
      toast({
        title: "Success",
        description: "Recommendation updated successfully",
      });
      setIsEditRecommendationDialogOpen(false);
      setEditingRecommendationId(null);
      recommendationForm.reset({ type: "", description: "" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onUpdateRecommendation = (data: z.infer<typeof recommendationSchema>) => {
    if (editingRecommendationId !== null) {
      updateRecommendation.mutate({
        ...data,
        id: editingRecommendationId,
      });
    }
  };

  if (isLoadingPatient || isLoadingRecommendations) {
    return (
      <div className="p-6">
        <Skeleton className="h-12 w-[250px] mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-lg" />
          <Skeleton className="h-[400px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Patient Not Found</CardTitle>
              <CardDescription>
                The patient you are looking for does not exist or you don't have
                access.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/patients")}>
                Back to Patients
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-neutral-light p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {patient.user?.firstName} {patient.user?.lastName}
            </h1>
            <p className="text-gray-500">Patient ID: {patient.id}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Patient
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Patient Information</DialogTitle>
                </DialogHeader>
                <Form {...patientForm}>
                  <form
                    onSubmit={patientForm.handleSubmit(onUpdatePatient)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={patientForm.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={patientForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={patientForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={patientForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={patientForm.control}
                        name="profession"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profession</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={patientForm.control}
                        name="workplace"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Workplace</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={patientForm.control}
                      name="medicalHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical History</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={patientForm.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergies</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={patientForm.control}
                      name="consultations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consultations</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Recommendations Section */}
                    <div>
                      <div className="mb-2 flex justify-between items-center">
                        <FormLabel className="text-sm font-medium">Recommendations</FormLabel>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsAddRecommendationDialogOpen(true);
                          }}
                          className="h-7 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add New
                        </Button>
                      </div>
                      
                      <div className="border rounded-md p-3 mb-4">
                        {isLoadingRecommendations ? (
                          <Skeleton className="h-20 w-full" />
                        ) : recommendations.length > 0 ? (
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {recommendations.map((recommendation) => (
                              <div key={recommendation.id} className="p-2 border rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div className="font-medium">{recommendation.type}</div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      // Set the form values to the current recommendation
                                      recommendationForm.reset({
                                        type: recommendation.type,
                                        description: recommendation.description
                                      });
                                      // Store the recommendation ID for updating
                                      setEditingRecommendationId(recommendation.id);
                                      setIsEditRecommendationDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-sm">{recommendation.description}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {format(new Date(recommendation.createdAt), "MMM d, yyyy HH:mm")}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No recommendations recorded yet.
                            Click the Add New button to create a recommendation.
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <FormField
                      control={patientForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Active Patient</FormLabel>
                            <FormDescription>
                              Mark if this patient is actively being monitored
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={updatePatient.isPending}>
                        {updatePatient.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Remove Patient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove Patient</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove this patient from your list?
                    This action removes them from your care.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deletePatient.mutate()}
                    disabled={deletePatient.isPending}
                  >
                    {deletePatient.isPending ? "Removing..." : "Remove Patient"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Age:</dt>
                  <dd className="text-sm text-right">{patient.age || "N/A"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Email:</dt>
                  <dd className="text-sm text-right">
                    {patient.email || patient.user?.email || "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Phone:</dt>
                  <dd className="text-sm text-right">
                    {patient.phoneNumber || "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">
                    Address:
                  </dt>
                  <dd className="text-sm text-right">
                    {patient.address || "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">
                    Profession:
                  </dt>
                  <dd className="text-sm text-right">
                    {patient.profession || "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">
                    Workplace:
                  </dt>
                  <dd className="text-sm text-right">
                    {patient.workplace || "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Status:</dt>
                  <dd className="text-sm text-right">
                    <Badge variant={patient.isActive ? "default" : "secondary"}>
                      {patient.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    Allergies:
                  </dt>
                  <dd className="text-sm">
                    {patient.allergies || "None recorded"}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    Medical History:
                  </dt>
                  <dd className="text-sm">
                    {patient.medicalHistory || "No medical history recorded"}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">
                    Consultations:
                  </dt>
                  <dd className="text-sm">
                    {patient.consultations || "None recorded"}
                  </dd>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <dt className="text-sm font-medium text-gray-500">
                      Recommendations:
                    </dt>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsAddRecommendationDialogOpen(true)}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  <dd className="text-sm">
                    {recommendations.length > 0 ? (
                      <div className="space-y-2">
                        {recommendations.map((recommendation) => (
                          <div key={recommendation.id} className="p-2 border rounded-lg">
                            <div className="font-medium">{recommendation.type}</div>
                            <div className="text-sm">{recommendation.description}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {format(new Date(recommendation.createdAt), "MMM d, yyyy HH:mm")}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      "No recommendations recorded"
                    )}
                  </dd>
                </div>
                
                {/* Add Recommendation Dialog */}
                <Dialog open={isAddRecommendationDialogOpen} onOpenChange={setIsAddRecommendationDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Recommendation</DialogTitle>
                      <DialogDescription>
                        Add a new recommendation for this patient
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...recommendationForm}>
                      <form
                        onSubmit={recommendationForm.handleSubmit(onAddRecommendation)}
                        className="space-y-4"
                      >
                        <FormField
                          control={recommendationForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select recommendation type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Medication">Medication</SelectItem>
                                    <SelectItem value="Exercise">Exercise</SelectItem>
                                    <SelectItem value="Diet">Diet</SelectItem>
                                    <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                                    <SelectItem value="Follow Up">Follow Up</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={recommendationForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea rows={4} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={addRecommendation.isPending}
                          >
                            {addRecommendation.isPending
                              ? "Adding..."
                              : "Add Recommendation"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                
                {/* Edit Recommendation Dialog */}
                <Dialog open={isEditRecommendationDialogOpen} onOpenChange={setIsEditRecommendationDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Recommendation</DialogTitle>
                      <DialogDescription>
                        Update this recommendation
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...recommendationForm}>
                      <form
                        onSubmit={recommendationForm.handleSubmit(onUpdateRecommendation)}
                        className="space-y-4"
                      >
                        <FormField
                          control={recommendationForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <FormControl>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select recommendation type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Medication">Medication</SelectItem>
                                    <SelectItem value="Exercise">Exercise</SelectItem>
                                    <SelectItem value="Diet">Diet</SelectItem>
                                    <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                                    <SelectItem value="Follow Up">Follow Up</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={recommendationForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea rows={4} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={updateRecommendation.isPending}
                          >
                            {updateRecommendation.isPending
                              ? "Updating..."
                              : "Update Recommendation"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAlerts ? (
                <Skeleton className="h-20 w-full" />
              ) : alerts.filter((a) => a.status === "active").length > 0 ? (
                <div className="space-y-2">
                  {alerts
                    .filter((a) => a.status === "active")
                    .map((alert) => (
                      <Alert
                        key={alert.id}
                        variant="destructive"
                        className="flex justify-between items-center"
                      >
                        <div>
                          <AlertCircle className="h-4 w-4 inline-block mr-2" />
                          <span className="capitalize">
                            {alert.parameterName}
                          </span>
                          : {alert.value}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateAlertStatus.mutate(alert.id)}
                          disabled={updateAlertStatus.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </Alert>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No active alerts</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="parameters" className="space-y-4">
          <TabsList>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="limits">Parameter Limits</TabsTrigger>
            <TabsTrigger value="allAlerts">All Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="parameters">
            <Card>
              <CardHeader>
                <CardTitle>Patient Parameters</CardTitle>
                <CardDescription>
                  Track patient's vital signs and health parameters over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingParameters ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : parameters.length > 0 ? (
                  <div className="space-y-6">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="timestamp" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="#8884d8"
                          />
                          <Line
                            type="monotone"
                            dataKey="pulse"
                            stroke="#82ca9d"
                          />
                          <Line
                            type="monotone"
                            dataKey="spo2"
                            stroke="#ffc658"
                          />
                          <Line
                            type="monotone"
                            dataKey="ecg"
                            stroke="#ff7300"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Temperature</TableHead>
                            <TableHead>Pulse</TableHead>
                            <TableHead>SPO2</TableHead>
                            <TableHead>ECG</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parameters.map((param) => (
                            <TableRow key={param.id}>
                              <TableCell>
                                {format(
                                  new Date(param.timestamp),
                                  "MMM d, yyyy HH:mm:ss",
                                )}
                              </TableCell>
                              <TableCell>{param.temperature}</TableCell>
                              <TableCell>{param.pulse}</TableCell>
                              <TableCell>{param.spo2}</TableCell>
                              <TableCell>{param.ecg}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">
                      No parameter data available for this patient
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limits">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Parameter Limits</CardTitle>
                  <CardDescription>
                    Set thresholds for patient parameters to trigger alerts
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog
                    open={isAddLimitDialogOpen}
                    onOpenChange={setIsAddLimitDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Limit
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Parameter Limit</DialogTitle>
                      <DialogDescription>
                        Set a new parameter limit threshold to trigger alerts
                        when exceeded
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...limitForm}>
                      <form
                        onSubmit={limitForm.handleSubmit(onAddLimit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={limitForm.control}
                          name="parameterName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Parameter</FormLabel>
                              <FormControl>
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                >
                                  <option value="temperature">
                                    Temperature
                                  </option>
                                  <option value="pulse">Pulse</option>
                                  <option value="spo2">SPO2</option>
                                  <option value="ecg">ECG</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={limitForm.control}
                            name="minValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum Value</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={limitForm.control}
                            name="maxValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Maximum Value</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="submit"
                            disabled={addParameterLimit.isPending}
                          >
                            {addParameterLimit.isPending
                              ? "Adding..."
                              : "Add Limit"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                  
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (selectedLimitIds.length === 0) {
                        toast({
                          title: "No limits selected",
                          description: "Please select at least one parameter limit to delete.",
                          variant: "destructive"
                        });
                      } else {
                        deleteParameterLimit.mutate(selectedLimitIds);
                      }
                    }}
                    disabled={deleteParameterLimit.isPending}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    {selectedLimitIds.length > 0 
                      ? `Delete Limit${selectedLimitIds.length > 1 ? 's' : ''} (${selectedLimitIds.length})` 
                      : 'Delete Limit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingLimits ? (
                  <Skeleton className="h-20 w-full" />
                ) : parameterLimits.length > 0 ? (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Parameter</TableHead>
                          <TableHead>Min Value</TableHead>
                          <TableHead>Max Value</TableHead>
                          <TableHead>Last Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parameterLimits.map((limit) => (
                          <TableRow key={limit.id}>
                            <TableCell>
                              <input 
                                type="checkbox" 
                                checked={selectedLimitIds.includes(limit.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLimitIds([...selectedLimitIds, limit.id]);
                                  } else {
                                    setSelectedLimitIds(selectedLimitIds.filter(id => id !== limit.id));
                                  }
                                }}
                                className="h-4 w-4"
                              />
                            </TableCell>
                            <TableCell className="capitalize">
                              {limit.parameterName}
                            </TableCell>
                            <TableCell>{limit.minValue}</TableCell>
                            <TableCell>{limit.maxValue}</TableCell>
                            <TableCell>
                              {format(
                                new Date(limit.updatedAt),
                                "MMM d, yyyy HH:mm",
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No parameter limits defined</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Click "Add Limit" to create one
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="allAlerts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Alert History</CardTitle>
                  <CardDescription>
                    View all alerts for this patient
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (selectedAlertIds.length === 0) {
                        toast({
                          title: "No alerts selected",
                          description: "Please select at least one alert to delete.",
                          variant: "destructive"
                        });
                      } else {
                        deleteAlert.mutate(selectedAlertIds);
                      }
                    }}
                    disabled={deleteAlert.isPending}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    {selectedAlertIds.length > 0 
                     ? `Delete Alert${selectedAlertIds.length > 1 ? 's' : ''} (${selectedAlertIds.length})` 
                     : 'Delete Alert'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAlerts ? (
                  <Skeleton className="h-20 w-full" />
                ) : alerts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Parameter</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Limit Type</TableHead>
                        <TableHead>Limit Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Patient Notes</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <input 
                              type="checkbox" 
                              checked={selectedAlertIds.includes(alert.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAlertIds([...selectedAlertIds, alert.id]);
                                } else {
                                  setSelectedAlertIds(selectedAlertIds.filter(id => id !== alert.id));
                                }
                              }}
                              className="h-4 w-4"
                            />
                          </TableCell>
                          <TableCell>
                            {format(
                              new Date(alert.timestamp),
                              "MMM d, yyyy HH:mm:ss",
                            )}
                          </TableCell>
                          <TableCell className="capitalize">
                            {alert.parameterName}
                          </TableCell>
                          <TableCell>{alert.value}</TableCell>
                          <TableCell className="capitalize">
                            {alert.limitType || "N/A"}
                          </TableCell>
                          <TableCell>
                            {alert.limitValue || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                alert.status === "active"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {alert.status === "active"
                                ? "Active"
                                : "Acknowledged"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {alert.patientNote ? (
                              <div className="max-w-xs overflow-hidden">
                                <p className="text-sm text-gray-600 truncate">
                                  {alert.patientNote}
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-sm">No notes</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {alert.status === "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateAlertStatus.mutate(alert.id)
                                }
                                disabled={updateAlertStatus.isPending}
                              >
                                Acknowledge
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">
                      No alerts recorded for this patient
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default PatientDetail;
