import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Menu } from "lucide-react";

const Header = () => {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/status'],
  });
  
  const user = authData?.user || {
    id: 0,
    email: '',
    firstName: '',
    lastName: '',
    role: ''
  };
  
  const handleLogout = async () => {
    try {
      await apiRequest("/api/logout", 'POST', {});
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  const getDashboardPath = () => {
    return user?.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard';
  };
  
  // Define navigation items based on user role
  const getNavItems = () => {
    const isDoctor = user?.role === 'doctor';
    const dashboardPath = getDashboardPath();
    
    const items = [
      { title: "Dashboard", path: dashboardPath }
    ];
    
    // Only doctors can see patients
    if (isDoctor) {
      items.push({ title: "Patients", path: "/patients" });
    }
    
    // Settings is accessible to all roles
    items.push({ title: "Settings", path: "/settings" });
    
    return items;
  };
  
  const navItems = getNavItems();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary-dark mr-2"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <span className="text-xl font-medium text-gray-900">HealthGuardian</span>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium 
                    ${isActive(item.path) 
                      ? "border-primary text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}
                  >
                    {item.title}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Button variant="ghost" size="icon" className="mr-2">
              <Bell className="h-5 w-5 text-gray-500" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center">
                  <span className="mr-2 text-sm">{`${user?.firstName || ""} ${user?.lastName || ""}` || "User"}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="w-full cursor-pointer">Settings</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center sm:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col h-full py-6">
                  <div className="flex items-center mb-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-primary-dark mr-2"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    <span className="text-xl font-medium">HealthGuardian</span>
                  </div>
                  
                  <nav className="flex flex-col space-y-1 flex-1">
                    {navItems.map((item) => (
                      <Link key={item.path} href={item.path}>
                        <a 
                          onClick={() => setMobileOpen(false)}
                          className={`px-3 py-2 rounded-md text-sm font-medium 
                            ${isActive(item.path) 
                              ? "bg-primary-light text-primary-dark" 
                              : "text-gray-600 hover:bg-gray-100"}`}
                        >
                          {item.title}
                        </a>
                      </Link>
                    ))}
                  </nav>
                  
                  <div className="mt-auto pt-6 border-t border-gray-200">
                    <div className="flex items-center px-3 mb-2">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src="" />
                        <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{`${user?.firstName || ""} ${user?.lastName || ""}` || "User"}</p>
                        <p className="text-xs text-gray-500">{user?.role || ""}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      Log out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
