import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
import { Link } from "wouter";
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
  recommendationType: z.string().min(1, "Recommendation type is required"),
  recommendationDescription: z
    .string()
    .min(1, "Recommendation description is required"),
});

type PatientProfileFormValues = z.infer<typeof patientProfileSchema>;

const Patients = () => {
  const [page, setPage] = useState(1);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const limit = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user info (doctor)
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/status");
      if (!res.ok) throw new Error("Failed to fetch auth status");
      return res.json();
    },
  });

  const { data: patients, isLoading } = useQuery({
    queryKey: ["/api/patients", page, limit],
    queryFn: async () => {
      const res = await fetch(
        `/api/patients?limit=${limit}&offset=${(page - 1) * limit}`,
      );
      if (!res.ok) throw new Error("Failed to fetch patients");
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });

  const { data: countData } = useQuery({
    queryKey: ["/api/patients/count"],
    queryFn: async () => {
      const res = await fetch("/api/patients/count");
      if (!res.ok) throw new Error("Failed to fetch patient count");
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });

  const { data: patientUsers = [], isLoading: isLoadingPatientUsers } =
    useQuery({
      queryKey: ["/api/users/role/patient"],
      queryFn: async () => {
        const res = await fetch("/api/users/role/patient");
        if (!res.ok) throw new Error("Failed to fetch patient users");
        return res.json();
      },
    });

  const totalPages = countData ? Math.ceil(countData.count / limit) : 0;
  const [search, setSearch] = useState("");
  const filteredPatients =
    patients?.filter((patient) =>
      `${patient.user?.firstName} ${patient.user?.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];

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
          humidity: Math.floor(Math.random() * 20) + 40,
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
      queryClient.invalidateQueries({ queryKey: ["/api/patients/count"] }); // Add this line
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

  const removePatient = useMutation({
    mutationFn: async (patientId: number) => {
      const res = await apiRequest(
        `/api/patient-profiles/${patientId}`,
        "DELETE",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patients/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "Success",
        description: "Patient has been removed",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove patient",
        variant: "destructive",
      });
    },
  });

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

    createPatientProfile.mutate({
      ...values,
      doctorId: authData.user.id,
    });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-neutral-light p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
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
        {/* Existing patient list table */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Patient List</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-48" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.user?.firstName} {patient.user?.lastName}
                      </TableCell>
                      <TableCell>
                        {patient.user?.email || patient.email}
                      </TableCell>
                      <TableCell>{patient.phoneNumber}</TableCell>
                      <TableCell>
                        {patient.dateOfBirth
                          ? format(new Date(patient.dateOfBirth), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(patient.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Link href={`/patients/${patient.id}`}>
                            <Button variant="link">View</Button>
                          </Link>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to remove this patient?",
                                )
                              ) {
                                removePatient.mutate(patient.id);
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No patients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= page - 1 && p <= page + 1),
                      )
                      .map((p, i, arr) => (
                        <PaginationItem key={p}>
                          {i > 0 && arr[i - 1] !== p - 1 && (
                            <PaginationItem>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          )}
                          <PaginationLink
                            isActive={page === p}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Patients;
