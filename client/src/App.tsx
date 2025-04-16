import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import DoctorDashboard from "@/pages/dashboard";
import PatientDashboard from "@/pages/patient-dashboard";
import Patients from "@/pages/patients";
import PatientDetail from "@/pages/patient-detail";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/login"; // We kept the file name but changed the export
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Header from "@/components/layout/header";

export type AuthData = {
  authenticated: boolean;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
};

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [location, setLocation] = useLocation();

  const { data: authData, isLoading } = useQuery<AuthData>({
    queryKey: ["/api/auth/status"],
    refetchOnWindowFocus: true,
    refetchInterval: 300000, // Refresh auth status every 5 minutes
  });

  useEffect(() => {
    if (authData) {
      setAuthenticated(authData.authenticated);

      if (authData.authenticated) {
        const role = authData.user?.role || null;
        setUserRole(role);

        // Redirect based on role and current location
        // Always redirect if on login or root when authenticated
        if (location === "/login" || location === "/") {
          setTimeout(() => {
            if (role === "doctor") {
              setLocation("/doctor-dashboard");
            } else if (role === "patient") {
              setLocation("/patient-dashboard");
            }
          }, 0);
        } else if (
          role === "patient" &&
          (location === "/patients" ||
            location === "/appointments" ||
            location === "/analytics")
        ) {
          // Redirect patients who try to access doctor-only pages
          setLocation("/patient-dashboard");
        }
      } else if (!authData.authenticated && location !== "/login") {
        setLocation("/login");
      }
    }
  }, [authData, location, setLocation]);

  if (isLoading || authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authenticated && location !== "/login") {
    setLocation("/login");
    return null;
  }

  return (
    <div className="flex h-screen flex-col">
      {authenticated && <Header />}
      <Switch>
        <Route path="/login" component={AuthPage} />
        <Route
          path="/"
          component={() => {
            // Redirect based on role
            if (userRole === "doctor") {
              setLocation("/doctor-dashboard");
            } else {
              setLocation("/patient-dashboard");
            }
            return null;
          }}
        />
        <Route path="/doctor-dashboard" component={DoctorDashboard} />
        <Route path="/patient-dashboard" component={PatientDashboard} />
        <Route path="/patients" component={Patients} />
        <Route path="/patients/:id" component={PatientDetail} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

export default App;
