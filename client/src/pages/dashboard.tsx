import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/dashboard/stat-card";
import ActiveAlertsCard from "@/components/dashboard/active-alerts-card";
import AddSampleAlerts from "@/components/dashboard/add-sample-alerts";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BellRing, Rss, Pill } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import * as z from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { AuthData } from "@/App";

// Patient profile form schema
const patientProfileSchema = z.object({
  userId: z.string().min(1, "Please select a patient user"),
  age: z.coerce.number().min(0, "Age must be a positive number"),
  cnp: z.string().min(1, "CNP is required"),
  address: z.string().min(1, "Address is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  profession: z.string().optional(),
  workplace: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  consultations: z.string().optional(),
  // Add recommendation fields
  recommendationType: z.string().min(1, "Recommendation type is required"),
  recommendationDescription: z
    .string()
    .min(1, "Recommendation description is required"),
});

type PatientProfileFormValues = z.infer<typeof patientProfileSchema>;

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

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
  user?: User;
};

type DashboardStats = {
  totalPatients: number;
  activeAlertsCount: number;
  patientsWithAllergiesCount: number;
  patientsUnderMedicationCount: number;
};

const Dashboard = () => {
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  // Get current user info (doctor)
  const { data: authData } = useQuery<AuthData>({
    queryKey: ["/api/auth/status"],
  });

  // Get patients count
  const { data: patientsCount = 0, isLoading: isLoadingPatientsCount } =
    useQuery<number>({
      queryKey: ["/api/patients/count"],
      queryFn: async () => {
        const res = await fetch("/api/patients/count");
        if (!res.ok) throw new Error("Failed to fetch patient count");
        return res.json();
      },
    });

  // Get patient users (role = 'patient')
  const { data: patientUsers = [], isLoading: isLoadingPatientUsers } =
    useQuery<User[]>({
      queryKey: ["/api/users/role/patient"],
      queryFn: async () => {
        const res = await fetch("/api/users/role/patient");
        if (!res.ok) throw new Error("Failed to fetch patient users");
        return res.json();
      },
    });

  // Get patients list
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<PatientProfile[]>({
    queryKey: ["/api/patients", authData?.user?.id], // adaugăm ca dependență
    queryFn: async () => {
      if (!authData?.user?.id) return [];
      const res = await fetch(`/api/patients?doctorId=${authData.user.id}`);
      if (!res.ok) throw new Error("Failed to fetch patients for doctor");
      return res.json();
    },
    enabled: !!authData?.user?.id, // rulează doar când avem doctorId
  });

  // Create patient profile mutation
  const createPatientProfile = useMutation({
    mutationFn: async (
      data: PatientProfileFormValues & { doctorId: number },
    ) => {
      const {
        recommendationType,
        recommendationDescription,
        ...patientProfileData
      } = data;
      const patientData = {
        ...patientProfileData,
        userId: parseInt(patientProfileData.userId, 10),
      };
      const response = await apiRequest(
        "/api/patient-profiles",
        "POST",
        patientData,
      );
      return {
        profile: response,
        recommendationType,
        recommendationDescription,
      };
    },
    onSuccess: async (data) => {
      const profileId = data.profile.id;

      // Create initial parameters
      const initialParameters = Array(3)
        .fill(null)
        .map(() => ({
          patientProfileId: profileId,
          ecg: Math.floor(Math.random() * 15) + 70,
          spo2: Math.floor(Math.random() * 20) + 40,
          temperature: 36.5 + Math.random() * 1.5,
          pulse: Math.floor(Math.random() * 15) + 65,
        }));

      for (const parameter of initialParameters) {
        await apiRequest("/api/parameters", "POST", parameter);
      }

      // Create recommendation
      const recommendation = {
        patientProfileId: profileId,
        type: data.recommendationType,
        description: data.recommendationDescription,
      };
      await apiRequest("/api/recommendations", "POST", recommendation);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/count"] }); // Ensure this is included
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });

      toast({
        title: "Success",
        description: "Patient has been added successfully with recommendations",
        variant: "default",
      });

      setIsAddPatientOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add patient",
        variant: "destructive",
      });
    },
  });

  // Form definition
  const form = useForm<PatientProfileFormValues>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      userId: "",
      age: 0,
      cnp: "",
      address: "",
      phoneNumber: "",
      email: "",
      profession: "",
      workplace: "",
      medicalHistory: "",
      allergies: "",
      consultations: "",
      recommendationType: "",
      recommendationDescription: "",
    },
  });

  const onSubmit = (values: PatientProfileFormValues) => {
    if (!authData?.user?.id) {
      toast({
        title: "Error",
        description: "Doctor information not available",
        variant: "destructive",
      });
      return;
    }

    // Add doctorId to the values
    createPatientProfile.mutate({
      ...values,
      doctorId: authData.user.id,
    });
  };

  const {
    data: dashboardStats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/stats/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/stats/dashboard");
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return res.json();
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <main className="flex-1 overflow-y-auto bg-neutral-light">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Doctor Dashboard
          </h1>
          <Dialog open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen}>
            <DialogTrigger asChild>
              <Button variant="default">Add Patient</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Patient User</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a patient user" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patientUsers.map((user) => (
                              <SelectItem key={user.id} value={String(user.id)}>
                                {user.firstName} {user.lastName} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
                      name="cnp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNP</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
                    name="consultations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Consultations</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-medium mb-4">
                      Doctor's Recommendation
                    </h3>

                    <FormField
                      control={form.control}
                      name="recommendationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recommendation Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select recommendation type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Diet">Diet</SelectItem>
                              <SelectItem value="Exercise">Exercise</SelectItem>
                              <SelectItem value="Medication">
                                Medication
                              </SelectItem>
                              <SelectItem value="Lifestyle">
                                Lifestyle
                              </SelectItem>
                              <SelectItem value="Treatment">
                                Treatment
                              </SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="recommendationDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recommendation Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddPatientOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPatientProfile.isPending}
                    >
                      {createPatientProfile.isPending
                        ? "Adding..."
                        : "Add Patient"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Overview */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {isLoadingStats || isLoadingPatientsCount ? (
              Array(4)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)
            ) : (
              <>
                <StatCard
                  title="Total Patients"
                  value={stats?.totalPatients || 0}
                  icon={Users}
                  color="primary"
                  link="/patients"
                />
                <StatCard
                  title="Active Alerts"
                  value={stats?.activeAlertsCount || 0}
                  icon={BellRing}
                  color="info"
                />
                <StatCard
                  title="Patients with Allergies"
                  value={stats?.patientsWithAllergiesCount || 0}
                  icon={Rss}
                  color="accent"
                />
                <StatCard
                  title="Patients Under Medication"
                  value={stats?.patientsUnderMedicationCount || 0}
                  icon={Pill}
                  color="accent"
                />
              </>
            )}
          </div>
          
          {/* Active Alerts List */}
          <div className="mt-8">

            <ActiveAlertsCard />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
