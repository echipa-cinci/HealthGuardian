import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form schema
const registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["doctor", "patient"], {
    required_error: "Please select a role",
  }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      return await apiRequest("/api/login", 'POST', data);
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
      toast({
        title: "Login successful",
        description: "Welcome to HealthGuardian!",
      });
      
      // Redirect based on role and ensure it's not delayed
      setTimeout(() => {
        if (user.role === "doctor") {
          setLocation("/doctor-dashboard");
        } else if (user.role === "patient") {
          setLocation("/patient-dashboard");
        } else {
          setLocation("/");
        }
      }, 0);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      // Error handled in mutation
    }
  };
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "patient",
      password: "",
      confirmPassword: "",
    },
  });
  
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const { confirmPassword, ...registerData } = data;
      return await apiRequest("/api/register", 'POST', registerData);
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "You can now log in to your account",
      });
      setActiveTab("login");
      registerForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      await registerMutation.mutateAsync(data);
    } catch (error) {
      // Error handled in mutation
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Welcome to HealthGuardian</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <Tabs 
            defaultValue="login" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 rounded-none">
              <TabsTrigger value="login" className="py-3">Login</TabsTrigger>
              <TabsTrigger value="register" className="py-3">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="p-6">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="doctor@example.com"
                    {...loginForm.register("email")} 
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    {...loginForm.register("password")} 
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-950 hover:bg-blue-900"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="p-6">
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input 
                    id="register-email" 
                    type="email"
                    placeholder="doctor@example.com"
                    {...registerForm.register("email")} 
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    {...registerForm.register("firstName")} 
                  />
                  {registerForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    {...registerForm.register("lastName")} 
                  />
                  {registerForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    onValueChange={(value) => registerForm.setValue("role", value as "doctor" | "patient")} 
                    defaultValue={registerForm.getValues("role")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                  {registerForm.formState.errors.role && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.role.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    {...registerForm.register("password")} 
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    {...registerForm.register("confirmPassword")} 
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-950 hover:bg-blue-900"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Registering..." : "Register"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
